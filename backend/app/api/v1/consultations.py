from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Header
from typing import Dict, Any, Optional
from ...schemas.chat import (
    RefreshMemoryResponse,
    VisionAnalysisRequest,
    VisionAnalysisResponse,
)
from ...services.ollama_service import OllamaService, OllamaServiceException
from ...services.context_manager import ContextManager
from ...ai.language_resolver import resolve_response_language
from ...core.auth import validate_consultation_ownership

router = APIRouter(prefix="", tags=["Consultations"])

@router.post("/consultations/{consultation_id}/refresh-memory", response_model=RefreshMemoryResponse)
async def refresh_consultation_memory(
    consultation_id: str,
    authorization: Optional[str] = Header(None)
):
    """
    Clears the active consultation context.txt completely, resets memory,
    and increments the memory generation version so that any pending in-flight
    AI responses are invalidated and cannot repopulate the cleared context.
    """
    clean_id = consultation_id.strip()
    if not clean_id:
        raise HTTPException(status_code=400, detail="Invalid consultation ID")

    # 1. Validate consultation ownership
    validate_consultation_ownership(clean_id, authorization)

    now_utc = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    # 2. Acquire lock, clear active context.txt, and increment generation version
    new_version = ContextManager.clear_context(clean_id)

    return RefreshMemoryResponse(
        success=True,
        message="Consultation memory cleared successfully.",
        consultation_id=clean_id,
        reconstructed_at=now_utc,
        memory_version=new_version
    )

@router.get("/consultations/{consultation_id}/context")
async def get_consultation_context(
    consultation_id: str,
    authorization: Optional[str] = Header(None)
):
    """Returns the canonical context.txt content for the authenticated consultation."""
    clean_id = consultation_id.strip()
    validate_consultation_ownership(clean_id, authorization)

    content = ContextManager.load_context_text(clean_id)
    return {
        "consultation_id": clean_id,
        "context": content or "No prior context found."
    }

@router.post("/vision/analyze", response_model=VisionAnalysisResponse)
async def analyze_vision_media(
    payload: VisionAnalysisRequest,
    authorization: Optional[str] = Header(None)
):
    """
    Analyzes medical imagery or video frames using primary model qwen2.5vl:3b,
    in the requested response language, and appends the observation into canonical context.txt.
    """
    consultation_id = payload.consultation_id.strip()
    validate_consultation_ownership(consultation_id, authorization)

    request_generation = ContextManager.get_memory_generation(consultation_id)
    now_utc = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    target_language = resolve_response_language(payload.prompt or "", payload.language)

    try:
        observation = await OllamaService.analyze_with_vision_model(
            image_base64=payload.image_base64,
            prompt=payload.prompt,
            response_language=target_language,
            mode=payload.mode or "doctor"
        )
    except OllamaServiceException as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Vision AI service unavailable: {str(e)}"
        )

    # Store concise observation in canonical context.txt with generation check
    ContextManager.append_entry(
        consultation_id=consultation_id,
        mode="VIDEO",
        speaker="SYSTEM",
        content_type="VISUAL_OBSERVATION",
        content=f"[Language: {target_language}] Vision Analysis Observation: {observation}",
        timestamp=now_utc,
        expected_generation=request_generation
    )

    return VisionAnalysisResponse(
        consultation_id=consultation_id,
        observation=observation,
        timestamp=now_utc,
        language=target_language
    )
