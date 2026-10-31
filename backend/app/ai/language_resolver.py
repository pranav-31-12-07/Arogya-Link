"""
AAROGYA LINK — Language Detection and Resolution Engine
Implements strict priority-based response language resolution:
1. In-message explicit language request
2. Explicit application language selector
3. Message-level language auto-detection
"""

import re
from typing import Optional

# Language name normalization map
LANGUAGE_MAP = {
    "en": "English",
    "english": "English",
    "hi": "Hindi",
    "hindi": "Hindi",
    "हिन्दी": "Hindi",
    "हिंदी": "Hindi",
    "mr": "Marathi",
    "marathi": "Marathi",
    "मराठी": "Marathi",
    "bn": "Bengali",
    "bengali": "Bengali",
    "বাংলা": "Bengali",
    "kn": "Kannada",
    "kannada": "Kannada",
    "ಕನ್ನಡ": "Kannada",
    "pa": "Punjabi",
    "punjabi": "Punjabi",
    "ਪੰਜਾਬੀ": "Punjabi",
    "hinglish": "Hinglish",
    "auto": "Auto"
}

# Regex for explicit language directives inside user's message
IN_MESSAGE_PATTERNS = [
    (r"\b(?:reply|respond|answer|speak|write)\s+(?:in|using)\s+hindi\b|\bहिंदी\s+में\b|\bहिन्दी\s+में\b", "Hindi"),
    (r"\b(?:reply|respond|answer|speak|write)\s+(?:in|using)\s+english\b|\bअंग्रेजी\s+में\b", "English"),
    (r"\b(?:reply|respond|answer|speak|write)\s+(?:in|using)\s+marathi\b|\bमराठीत\b|\bमराठी\s+मध्ये\b", "Marathi"),
    (r"\b(?:reply|respond|answer|speak|write)\s+(?:in|using)\s+bengali\b|\bবাংলায়\b", "Bengali"),
    (r"\b(?:reply|respond|answer|speak|write)\s+(?:in|using)\s+kannada\b|\bಕನ್ನಡದಲ್ಲಿ\b", "Kannada"),
    (r"\b(?:reply|respond|answer|speak|write)\s+(?:in|using)\s+punjabi\b|\bਪੰਜਾਬੀ\s+ਵਿੱਚ\b", "Punjabi"),
    (r"\b(?:reply|respond|answer|speak|write)\s+(?:in|using)\s+hinglish\b", "Hinglish"),
]

# Distinctive Marathi words/morphemes in Devanagari
MARATHI_MARKERS = [
    "मला", "आहे", "नाही", "घशात", "खाज", "येत", "होते", "डोकेदुखी", "पोटात", "दुखत",
    "कधीपासून", "काय", "करावे", "त्रास", "सांगा", "नमस्कार", "डॉक्टर"
]

# Distinctive Hindi words in Devanagari
HINDI_MARKERS = [
    "मुझे", "है", "नहीं", "गले", "दर्द", "हो", "रहा", "रही", "सिरदर्द", "पेट",
    "कबसे", "क्या", "करें", "बताएं", "नमस्ते", "जी"
]

# Hinglish keywords in Roman script
HINGLISH_KEYWORDS = [
    "mujhe", "mera", "meri", "mere", "dard", "ho raha", "ho rahi", "hai", "kya",
    "karu", "kare", "batao", "bataiye", "kal se", "aaj se", "bukhar", "khansi",
    "gale me", "sar dard", "headache ho", "thik", "nahi", "accha", "namaste"
]

def resolve_response_language(message: str, selected_language: Optional[str] = None) -> str:
    """
    Resolves the exact target response language based on the 3-tier priority rule:
    1. Explicit in-message command
    2. Selected language in UI (if not Auto or None)
    3. Auto-detection from the latest message
    """
    clean_msg = message.strip() if message else ""
    msg_lower = clean_msg.lower()

    # Priority 1: In-message explicit instruction
    for pattern, lang in IN_MESSAGE_PATTERNS:
        if re.search(pattern, msg_lower, re.IGNORECASE):
            return lang

    # Priority 2: User explicitly selected language from application UI
    if selected_language:
        normalized_sel = LANGUAGE_MAP.get(selected_language.strip().lower())
        if normalized_sel and normalized_sel != "Auto":
            return normalized_sel

    # Priority 3: Language detection from latest message
    detected = detect_message_language(clean_msg)
    return detected or "English"

def detect_message_language(text: str) -> str:
    """Detects the primary language of the text without looking at past messages."""
    if not text:
        return "English"

    # 1. Script-based detection
    has_devanagari = bool(re.search(r"[\u0900-\u097F]", text))
    has_bengali = bool(re.search(r"[\u0980-\u09FF]", text))
    has_kannada = bool(re.search(r"[\u0C80-\u0CFF]", text))
    has_gurmukhi = bool(re.search(r"[\u0A00-\u0A7F]", text))

    if has_bengali:
        return "Bengali"
    if has_kannada:
        return "Kannada"
    if has_gurmukhi:
        return "Punjabi"

    # If Devanagari script is present, distinguish between Marathi and Hindi
    if has_devanagari:
        text_words = set(text.split())
        marathi_hits = sum(1 for w in MARATHI_MARKERS if w in text)
        hindi_hits = sum(1 for w in HINDI_MARKERS if w in text)

        if marathi_hits > hindi_hits:
            return "Marathi"
        return "Hindi"

    # If Roman script, check for Hinglish
    lower_text = text.lower()
    hinglish_hits = sum(1 for kw in HINGLISH_KEYWORDS if kw in lower_text)
    if hinglish_hits >= 1:
        return "Hinglish"

    # Default for Latin/English script
    return "English"
