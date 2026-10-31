from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any
from ...schemas.chat import (
    RefreshMemoryResponse,
    VisionAnalysisRequest,
    VisionAnalysisResponse,
)
from ...services.ollama_service import OllamaService, OllamaServiceException
from ...services.context_manager import ContextManager
from ...ai.language_resolver import resolve_response_language

router = APIRouter(prefix="", tags=["Consultations"])

@router.post("/consultations/{consultation_id}/refresh-memory", response_model=RefreshMemoryResponse)
async def refresh_consultation_memory(consultation_id: str):
    """
    Reconstructs the consultation context.txt from historical interaction records,
    ensuring shared memory is fresh, validated, and available for both Text and Vision models.
    """
    clean_id = consultation_id.strip()
    if not clean_id:
        raise HTTPException(status_code=400, detail="Invalid consultation ID")

    # Read current context entries
    current_raw = ContextManager.load_context_text(clean_id)
    now_utc = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    events = []
    if current_raw:
        raw_items = current_raw.split("\n[")
        for item in raw_items:
            if not item.strip() or item.startswith("AAROGYA LINK - CONSULTATION CONTEXT"):
                continue
            lines = item.split("\n")
            ts = lines[0].rstrip("]") if "]" in lines[0] else now_utc
            mode = "TEXT"
            speaker = "PATIENT"
            c_type = "MESSAGE"
            content_lines = []
            capturing = False

            for line in lines:
                if line.startswith("Mode:"):
                    mode = line.split(":", 1)[1].strip()
                elif line.startswith("Speaker:"):
                    speaker = line.split(":", 1)[1].strip()
                elif line.startswith("Type:"):
                    c_type = line.split(":", 1)[1].strip()
                elif line.startswith("Content:"):
                    capturing = True
                    continue
                elif capturing:
                    content_lines.append(line)

            events.append({
                "timestamp": ts,
                "mode": mode,
                "speaker": speaker,
                "type": c_type,
                "content": "\n".join(content_lines).strip()
            })

    ContextManager.rebuild_context(clean_id, events)

    return RefreshMemoryResponse(
        success=True,
        message="Memory refreshed successfully.",
        consultation_id=clean_id,
        reconstructed_at=now_utc
    )

@router.get("/consultations/{consultation_id}/context")
async def get_consultation_context(consultation_id: str):
    """Returns the raw context.txt content for the given consultation."""
    clean_id = consultation_id.strip()
    content = ContextManager.load_context_text(clean_id)
    return {
        "consultation_id": clean_id,
        "context": content or "No prior context found."
    }

@router.post("/vision/analyze", response_model=VisionAnalysisResponse)
async def analyze_vision_media(payload: VisionAnalysisRequest):
    """
    Analyzes medical imagery or video frames using primary model qwen2.5vl:3b,
    in the requested response language, and appends the observation into shared context.txt.
    """
    consultation_id = payload.consultation_id.strip()
    now_utc = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    target_language = resolve_response_language(payload.prompt or "", payload.language)

    try:
        observation = await OllamaService.analyze_with_vision_model(
            image_base64=payload.image_base64,
            prompt=payload.prompt,
            response_language=target_language
        )
    except OllamaServiceException as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Vision AI service unavailable: {str(e)}"
        )

    # Store concise observation in context.txt (do NOT store raw image base64!)
    ContextManager.append_entry(
        consultation_id=consultation_id,
        mode="VIDEO",
        speaker="SYSTEM",
        content_type="VISUAL_OBSERVATION",
        content=f"[Language: {target_language}] Vision Analysis Observation: {observation}",
        timestamp=now_utc
    )

    return VisionAnalysisResponse(
        consultation_id=consultation_id,
        observation=observation,
        timestamp=now_utc,
        language=target_language
    )
