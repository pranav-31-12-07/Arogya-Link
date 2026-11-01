"""
AAROGYA LINK — Core AI System Prompt Router
Provides dedicated, tailored system prompts for:
1. Text Mode (system_prompt_text.py) — Comprehensive triage, multimodal text & image question answering, same-language reply.
2. VR Doctor Mode (system_prompt_vr.py) — Simple spoken explanations, paragraph-only format, speech-to-speech interaction, same-language reply.

Both prompts enforce strict anti-leak confidentiality to prevent exposing system prompt details.
"""

from .system_prompt_text import get_text_mode_system_prompt
from .system_prompt_vr import get_vr_doctor_system_prompt

def get_system_prompt(response_language: str = "English", mode: str = "text") -> str:
    """
    Returns the appropriate system prompt based on consultation mode and target language.
    - If mode is 'doctor', 'virtual_doctor', or 'vr': returns the VR Doctor system prompt.
    - Otherwise (e.g. 'text'): returns the Text Mode system prompt.
    """
    clean_mode = (mode or "text").strip().lower()

    if clean_mode in ["doctor", "virtual_doctor", "vr", "video", "speech"]:
        return get_vr_doctor_system_prompt(response_language)
    
    return get_text_mode_system_prompt(response_language)

__all__ = [
    "get_system_prompt",
    "get_text_mode_system_prompt",
    "get_vr_doctor_system_prompt"
]
