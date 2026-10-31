"""
AAROGYA LINK — Consultation Context Manager
Manages isolated, consultation-specific `context.txt` artifacts.
Updated after every interaction and shared between Text AI (qwen2.5:7b)
and Vision AI (qwen2.5vl:3b).
"""

import os
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Any, Optional
from ..core.config import settings

_locks: Dict[str, threading.Lock] = {}
_global_lock = threading.Lock()

def _get_consultation_lock(consultation_id: str) -> threading.Lock:
    with _global_lock:
        if consultation_id not in _locks:
            _locks[consultation_id] = threading.Lock()
        return _locks[consultation_id]

class ContextManager:
    """Manages consultation-specific context artifacts."""

    @staticmethod
    def get_consultation_dir(consultation_id: str) -> Path:
        # Sanitize consultation_id to prevent directory traversal
        clean_id = "".join(c for c in consultation_id if c.isalnum() or c in ("-", "_"))
        if not clean_id:
            clean_id = "default_consultation"
        consultation_dir = settings.STORAGE_DIR / clean_id
        consultation_dir.mkdir(parents=True, exist_ok=True)
        return consultation_dir

    @staticmethod
    def get_context_path(consultation_id: str) -> Path:
        return ContextManager.get_consultation_dir(consultation_id) / "context.txt"

    @classmethod
    def load_context_text(cls, consultation_id: str) -> str:
        """Reads the raw context.txt content for a consultation."""
        path = cls.get_context_path(consultation_id)
        lock = _get_consultation_lock(consultation_id)
        with lock:
            if not path.exists():
                return ""
            try:
                return path.read_text(encoding="utf-8")
            except Exception as e:
                print(f"[ContextManager] Error reading context for {consultation_id}: {e}")
                return ""

    @classmethod
    def append_entry(
        cls,
        consultation_id: str,
        mode: str,
        speaker: str,
        content_type: str,
        content: str,
        timestamp: Optional[str] = None
    ) -> None:
        """Appends a new interaction event to the consultation's context.txt."""
        path = cls.get_context_path(consultation_id)
        lock = _get_consultation_lock(consultation_id)
        
        if not timestamp:
            timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

        entry = (
            f"\n[{timestamp}]\n"
            f"Mode: {mode.upper()}\n"
            f"Speaker: {speaker.upper()}\n"
            f"Type: {content_type.upper()}\n"
            f"Content:\n{content.strip()}\n"
        )

        with lock:
            if not path.exists():
                header = (
                    f"AAROGYA LINK - CONSULTATION CONTEXT\n"
                    f"Consultation ID: {consultation_id}\n"
                    f"Created At: {timestamp}\n"
                    f"=====================================\n"
                )
                path.write_text(header + entry, encoding="utf-8")
            else:
                with open(path, "a", encoding="utf-8") as f:
                    f.write(entry)

    @classmethod
    def get_chat_history_for_llm(cls, consultation_id: str, max_turns: int = 12) -> List[Dict[str, str]]:
        """
        Parses context.txt and returns message dictionaries for Ollama chat:
        [{'role': 'user'|'assistant', 'content': '...'}]
        """
        context_text = cls.load_context_text(consultation_id)
        if not context_text:
            return []

        entries = context_text.split("\n[")
        messages = []

        for item in entries:
            if not item.strip() or item.startswith("AAROGYA LINK - CONSULTATION CONTEXT"):
                continue

            lines = item.split("\n")
            speaker = None
            content_lines = []
            capturing_content = False

            for line in lines:
                if line.startswith("Speaker:"):
                    speaker = line.split(":", 1)[1].strip()
                elif line.startswith("Content:"):
                    capturing_content = True
                    continue
                elif capturing_content:
                    content_lines.append(line)

            if speaker and content_lines:
                content = "\n".join(content_lines).strip()
                if not content:
                    continue
                if speaker in ("PATIENT", "USER"):
                    messages.append({"role": "user", "content": content})
                elif speaker in ("ASSISTANT", "AI", "SYSTEM"):
                    messages.append({"role": "assistant", "content": content})

        # Return the most recent turns to maintain manageable context window
        return messages[-max_turns:]

    @classmethod
    def rebuild_context(cls, consultation_id: str, events: List[Dict[str, Any]]) -> str:
        """
        Reconstructs context.txt from scratch given structured events (used by Refresh Memory).
        """
        path = cls.get_context_path(consultation_id)
        lock = _get_consultation_lock(consultation_id)
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

        content_parts = [
            f"AAROGYA LINK - CONSULTATION CONTEXT (RECONSTRUCTED)",
            f"Consultation ID: {consultation_id}",
            f"Reconstructed At: {now_str}",
            f"Total Events: {len(events)}",
            f"=====================================\n"
        ]

        for ev in events:
            ts = ev.get("timestamp") or now_str
            mode = ev.get("mode", "TEXT").upper()
            speaker = ev.get("speaker", "PATIENT").upper()
            c_type = ev.get("type", "MESSAGE").upper()
            body = ev.get("content", "").strip()

            content_parts.append(
                f"[{ts}]\n"
                f"Mode: {mode}\n"
                f"Speaker: {speaker}\n"
                f"Type: {c_type}\n"
                f"Content:\n{body}\n"
            )

        full_text = "\n".join(content_parts)
        with lock:
            path.write_text(full_text, encoding="utf-8")

        return full_text
