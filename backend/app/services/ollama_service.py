"""
AAROGYA LINK — Unified Ollama Model Orchestration Service
Uses qwen2.5vl:3b as primary model for text, images, and camera frames.
"""

import httpx
from typing import List, Dict, Any, Optional
from ..core.config import settings
from ..ai.systemPrompt import get_system_prompt

class OllamaServiceException(Exception):
    """Base exception for Ollama service errors."""
    pass

class OllamaService:
    @staticmethod
    async def check_health() -> Dict[str, Any]:
        """Checks if the Ollama local inference server is reachable and primary model exists."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
                if res.status_code == 200:
                    models = [m.get("name") for m in res.json().get("models", [])]
                    primary_ready = any(settings.PRIMARY_MODEL in m for m in models)
                    return {
                        "status": "healthy",
                        "primary_model": settings.PRIMARY_MODEL,
                        "available_models": models,
                        "primary_model_ready": primary_ready
                    }
                return {"status": "unhealthy", "code": res.status_code}
        except Exception as e:
            return {"status": "offline", "error": str(e)}

    @staticmethod
    async def chat_with_text_model(
        user_message: str,
        conversation_history: List[Dict[str, str]],
        response_language: str = "English",
        image_base64: Optional[str] = None
    ) -> str:
        """
        Sends conversation to primary model (qwen2.5vl:3b) via Ollama chat API.
        Enforces target response language and handles multimodal text + image input.
        """
        clean_lang = (response_language or "English").strip()
        system_instruction = get_system_prompt(clean_lang)

        messages = [{"role": "system", "content": system_instruction}]
        
        # Add past turns
        for turn in conversation_history:
            messages.append({"role": turn["role"], "content": turn["content"]})

        # Build explicit language directive on the user turn with paragraph-only rule
        paragraph_rule = "Give your reply in natural, conversational paragraphs only. Do NOT use bullet points, numbered lists, or outline formatting (no 1., 2., *, -)."
        if clean_lang.lower() == "english":
            lang_directive = f"[CRITICAL INSTRUCTION: Respond 100% in English only. Do NOT output any Hindi, Devanagari script, or regional words. {paragraph_rule}]"
        elif clean_lang.lower() == "hindi":
            lang_directive = f"[CRITICAL INSTRUCTION: Respond 100% in clear Hindi (हिन्दी) only. {paragraph_rule}]"
        elif clean_lang.lower() == "marathi":
            lang_directive = f"[CRITICAL INSTRUCTION: Respond 100% in Marathi (मराठी) only. {paragraph_rule}]"
        elif clean_lang.lower() == "hinglish":
            lang_directive = f"[CRITICAL INSTRUCTION: Respond 100% in Hinglish (Hindi written using English/Roman alphabet). Do not use Devanagari script. {paragraph_rule}]"
        else:
            lang_directive = f"[CRITICAL INSTRUCTION: Respond 100% in {clean_lang} only. {paragraph_rule}]"

        user_content_with_directive = f"{user_message}\n\n{lang_directive}"

        # Add the new user turn (with optional image attachment for multimodal analysis)
        user_turn: Dict[str, Any] = {"role": "user", "content": user_content_with_directive}
        if image_base64:
            # Strip data URL header if present (e.g. data:image/jpeg;base64,...)
            clean_b64 = image_base64.split(",")[-1] if "," in image_base64 else image_base64
            user_turn["images"] = [clean_b64]

        messages.append(user_turn)

        payload = {
            "model": settings.PRIMARY_MODEL,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": 0.4,
                "top_p": 0.9,
                "num_gpu": 20,
                "num_predict": 300
            }
        }

        try:
            async with httpx.AsyncClient(timeout=settings.OLLAMA_TIMEOUT) as client:
                res = await client.post(
                    f"{settings.OLLAMA_BASE_URL}/api/chat",
                    json=payload
                )

                if res.status_code != 200:
                    raise OllamaServiceException(
                        f"Ollama returned HTTP {res.status_code}: {res.text}"
                    )

                data = res.json()
                assistant_message = data.get("message", {}).get("content", "").strip()
                if not assistant_message:
                    raise OllamaServiceException("Ollama returned an empty response.")

                # Zero-tolerance safety guard: If user requested English but model leaked Hindi/Devanagari,
                # translate the clinical triage response to English immediately before returning.
                if clean_lang.lower() == "english" and any('\u0900' <= ch <= '\u097f' for ch in assistant_message):
                    translate_payload = {
                        "model": settings.PRIMARY_MODEL,
                        "messages": [
                            {
                                "role": "system",
                                "content": "You are a professional medical translator for AAROGYA LINK. Translate the following clinical triage response accurately into clean, natural English. Output ONLY the English translation, with no Hindi, no Devanagari script, and no meta-commentary."
                            },
                            {
                                "role": "user",
                                "content": assistant_message
                            }
                        ],
                        "stream": False,
                        "options": {
                            "temperature": 0.1,
                            "num_gpu": 20,
                            "num_predict": 300
                        }
                    }
                    trans_res = await client.post(
                        f"{settings.OLLAMA_BASE_URL}/api/chat",
                        json=translate_payload
                    )
                    if trans_res.status_code == 200:
                        trans_data = trans_res.json()
                        translated_text = trans_data.get("message", {}).get("content", "").strip()
                        if translated_text:
                            assistant_message = translated_text

                return assistant_message

        except httpx.ConnectError:
            raise OllamaServiceException(
                f"Cannot connect to Ollama at {settings.OLLAMA_BASE_URL}. Please ensure Ollama is running."
            )
        except httpx.TimeoutException:
            raise OllamaServiceException(
                f"Ollama request timed out after {settings.OLLAMA_TIMEOUT}s."
            )
        except Exception as e:
            if isinstance(e, OllamaServiceException):
                raise
            raise OllamaServiceException(f"Error calling Ollama primary model: {str(e)}")

    @staticmethod
    async def analyze_with_vision_model(
        image_base64: str,
        prompt: Optional[str] = None,
        response_language: str = "English"
    ) -> str:
        """
        Sends image and clinical observation prompt to primary model (qwen2.5vl:3b)
        in the requested response language.
        """
        clean_b64 = image_base64.split(",")[-1] if "," in image_base64 else image_base64

        system_instruction = (
            f"You are AAROGYA LINK, an AI-assisted healthcare triage assistant. "
            f"TARGET RESPONSE LANGUAGE: {response_language}. "
            f"You MUST formulate your entire observation strictly in {response_language}. "
            f"Describe visible features cautiously and objectively without making a definitive clinical diagnosis."
        )

        user_prompt = prompt or (
            f"Please describe any visible characteristics or symptoms in this image that may warrant medical attention. "
            f"Respond entirely in {response_language}."
        )

        messages = [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": user_prompt, "images": [clean_b64]}
        ]

        payload = {
            "model": settings.PRIMARY_MODEL,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": 0.3,
                "num_gpu": 20,
                "num_predict": 250
            }
        }

        try:
            async with httpx.AsyncClient(timeout=settings.OLLAMA_TIMEOUT) as client:
                res = await client.post(
                    f"{settings.OLLAMA_BASE_URL}/api/chat",
                    json=payload
                )

                if res.status_code != 200:
                    raise OllamaServiceException(
                        f"Ollama Vision returned HTTP {res.status_code}: {res.text}"
                    )

                data = res.json()
                response_text = data.get("message", {}).get("content", "").strip()
                if not response_text:
                    raise OllamaServiceException("Ollama Vision returned an empty response.")

                return response_text

        except httpx.ConnectError:
            raise OllamaServiceException(
                f"Cannot connect to Ollama at {settings.OLLAMA_BASE_URL}."
            )
        except httpx.TimeoutException:
            raise OllamaServiceException(
                f"Ollama Vision request timed out after {settings.OLLAMA_TIMEOUT}s."
            )
        except Exception as e:
            if isinstance(e, OllamaServiceException):
                raise
            raise OllamaServiceException(f"Error calling Ollama vision model: {str(e)}")
