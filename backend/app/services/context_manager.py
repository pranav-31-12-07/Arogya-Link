"""
AAROGYA LINK — Active Consultation Context Manager
Manages isolated, consultation-specific `context.txt` artifacts.
Enforces:
1. Predictable structure: backend/storage/active_consultations/{consultation_id}/context.txt
2. Complete isolation: Evaluation and automated tests route to backend/storage/test_consultations/
3. Concurrency protection via consultation-level locks and atomic file replacements
4. Stale-request invalidation via memory generation/version IDs
5. Cross-mode continuity: Text Mode and VR Doctor share the same canonical context.txt
"""

import os
import re
import tempfile
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Any, Optional
from ..core.config import settings

_locks: Dict[str, threading.Lock] = {}
_memory_generations: Dict[str, int] = {}
_global_lock = threading.Lock()

def _get_consultation_lock(consultation_id: str) -> threading.Lock:
    with _global_lock:
        if consultation_id not in _locks:
            _locks[consultation_id] = threading.Lock()
        return _locks[consultation_id]

class ContextManager:
    """Manages isolated, canonical consultation context.txt files."""

    @staticmethod
    def is_test_consultation(consultation_id: str) -> bool:
        """Determines if a consultation ID belongs to automated tests or evaluations."""
        c = consultation_id.lower()
        return c.startswith("test_") or c.startswith("eval_") or "test" in c or "mock" in c

    @classmethod
    def get_consultation_dir(cls, consultation_id: str) -> Path:
        """
        Returns the isolated directory for this consultation.
        Production consultations: backend/storage/active_consultations/{consultation_id}
        Test consultations: backend/storage/test_consultations/{consultation_id}
        """
        clean_id = "".join(c for c in consultation_id if c.isalnum() or c in ("-", "_")).strip()
        if not clean_id:
            clean_id = "default_consultation"

        if cls.is_test_consultation(clean_id):
            base_dir = settings.TEST_STORAGE_DIR
        else:
            base_dir = settings.ACTIVE_STORAGE_DIR

        consultation_dir = base_dir / clean_id
        consultation_dir.mkdir(parents=True, exist_ok=True)
        return consultation_dir

    @classmethod
    def get_context_path(cls, consultation_id: str) -> Path:
        """Returns the canonical context.txt path for the consultation."""
        return cls.get_consultation_dir(consultation_id) / "context.txt"

    @classmethod
    def get_memory_generation(cls, consultation_id: str) -> int:
        """Returns the active memory generation/version ID for this consultation."""
        with _global_lock:
            if consultation_id not in _memory_generations:
                _memory_generations[consultation_id] = 1
            return _memory_generations[consultation_id]

    @classmethod
    def increment_memory_generation(cls, consultation_id: str) -> int:
        """Increments memory generation to invalidate pending/in-flight AI responses."""
        with _global_lock:
            current = _memory_generations.get(consultation_id, 1)
            _memory_generations[consultation_id] = current + 1
            return _memory_generations[consultation_id]

    @classmethod
    def load_context_text(cls, consultation_id: str) -> str:
        """
        Reads the raw context.txt content for the authenticated consultation.
        Never falls back to another consultation's context.
        """
        path = cls.get_context_path(consultation_id)
        lock = _get_consultation_lock(consultation_id)
        with lock:
            if not path.exists():
                return ""
            try:
                return path.read_text(encoding="utf-8").strip()
            except Exception as e:
                print(f"[ContextManager] Error reading context for {consultation_id}: {e}")
                return ""

    @classmethod
    def clear_context(cls, consultation_id: str) -> int:
        """
        Completely resets the active consultation context to empty.
        Increments the generation ID to cancel any stale in-flight responses.
        Returns the new memory generation ID.
        """
        path = cls.get_context_path(consultation_id)
        lock = _get_consultation_lock(consultation_id)
        with lock:
            new_version = cls.increment_memory_generation(consultation_id)
            try:
                if path.exists():
                    path.write_text("", encoding="utf-8")
            except Exception as e:
                print(f"[ContextManager] Error clearing context for {consultation_id}: {e}")
            return new_version

    @classmethod
    def append_entry(
        cls,
        consultation_id: str,
        mode: str,
        speaker: str,
        content_type: str,
        content: str,
        timestamp: Optional[str] = None,
        expected_generation: Optional[int] = None
    ) -> bool:
        """
        Appends an interaction event to the canonical context.txt atomically.
        If expected_generation is passed and does not match current generation,
        the entry is discarded to prevent stale writes after Refresh Memory.
        """
        clean_id = consultation_id.strip()
        lock = _get_consultation_lock(clean_id)

        with lock:
            # Check generation validity if provided
            if expected_generation is not None:
                current_gen = cls.get_memory_generation(clean_id)
                if expected_generation != current_gen:
                    print(f"[ContextManager] Discarding stale write for {clean_id}: gen {expected_generation} != {current_gen}")
                    return False

            path = cls.get_context_path(clean_id)
            if not timestamp:
                timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

            entry = (
                f"\n[{timestamp}]\n"
                f"Mode: {mode.upper()}\n"
                f"Speaker: {speaker.upper()}\n"
                f"Type: {content_type.upper()}\n"
                f"Content:\n{content.strip()}\n"
            )

            current_text = ""
            if path.exists():
                try:
                    current_text = path.read_text(encoding="utf-8")
                except Exception:
                    current_text = ""

            if not current_text.strip():
                header = (
                    f"AAROGYA LINK - CONSULTATION CONTEXT\n"
                    f"Consultation ID: {clean_id}\n"
                    f"Created At: {timestamp}\n"
                    f"=====================================\n"
                )
                new_full_text = header + entry
            else:
                new_full_text = current_text.rstrip() + "\n" + entry

            # Write atomically using a temporary file in the same directory
            dir_path = path.parent
            temp_file = tempfile.NamedTemporaryFile("w", dir=dir_path, delete=False, encoding="utf-8")
            try:
                temp_file.write(new_full_text)
                temp_file.flush()
                os.fsync(temp_file.fileno())
                temp_file.close()
                os.replace(temp_file.name, path)
            except Exception as e:
                if os.path.exists(temp_file.name):
                    try:
                        os.remove(temp_file.name)
                    except Exception:
                        pass
                raise e

            return True

    @classmethod
    def get_chat_history_for_llm(cls, consultation_id: str, max_turns: int = 8) -> List[Dict[str, str]]:
        """
        Parses context.txt strictly for this consultation and returns clean message turns:
        [{'role': 'user'|'assistant', 'content': '...'}]
        Empty context returns an empty list (clean start).
        """
        context_text = cls.load_context_text(consultation_id)
        if not context_text:
            return []

        pattern = re.compile(
            r'\[(\d{4}-\d{2}-\d{2}[^\]]+)\]\s*\n'
            r'Mode:\s*([^\n]+)\s*\n'
            r'Speaker:\s*([^\n]+)\s*\n'
            r'Type:\s*([^\n]+)\s*\n'
            r'Content:\s*\n(.*?)(?=\n\[\d{4}-\d{2}-\d{2}|\Z)',
            re.DOTALL
        )

        matches = pattern.findall(context_text)
        messages = []

        for ts, mode, speaker, ctype, raw_content in matches:
            clean_speaker = speaker.strip().upper()
            # Strip language annotation prefixes like [Language: English] or [English]
            clean_content = re.sub(r'^\[(?:Language:\s*)?[^\]]+\]\s*', '', raw_content.strip())
            if not clean_content:
                continue

            if clean_speaker in ("PATIENT", "USER"):
                messages.append({"role": "user", "content": clean_content})
            elif clean_speaker in ("ASSISTANT", "AI", "SYSTEM"):
                messages.append({"role": "assistant", "content": clean_content})

        return messages[-max_turns:]

