import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Header
from typing import Optional
from ...schemas.chat import ChatMessageRequest, ChatMessageResponse
from ...services.ollama_service import OllamaService, OllamaServiceException
from ...services.context_manager import ContextManager
from ...ai.language_resolver import resolve_response_language
from ...core.auth import validate_consultation_ownership

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("/message", response_model=ChatMessageResponse)
async def send_chat_message(
    payload: ChatMessageRequest,
    authorization: Optional[str] = Header(None)
):
    """
    Submits a patient message to AAROGYA LINK, invokes the primary qwen2.5vl:3b model,
    enforces ownership, target language, atomic context updates, and stale-write prevention.
    """
    consultation_id = payload.consultation_id.strip()
    user_text = payload.message.strip()

    if not user_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message content cannot be empty."
        )

    # 1. Validate consultation ownership against authenticated user
    validate_consultation_ownership(consultation_id, authorization)

    # 2. Capture initial memory generation version for race condition protection
    request_generation = ContextManager.get_memory_generation(consultation_id)

    # 3. Resolve exact target response language based on 3-tier priority
    target_language = resolve_response_language(user_text, payload.language)
    now_utc = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    # 4. Record patient message in canonical consultation context.txt
    entry_content = f"[Language: {target_language}] {user_text}"
    if payload.image_base64:
        entry_content += " [Image Attached for Analysis]"

    ContextManager.append_entry(
        consultation_id=consultation_id,
        mode=payload.mode,
        speaker="PATIENT",
        content_type="MESSAGE",
        content=entry_content,
        timestamp=now_utc,
        expected_generation=request_generation
    )

    # 5. Retrieve isolated conversation turns strictly for this consultation
    history = ContextManager.get_chat_history_for_llm(consultation_id, max_turns=8)
    if history and history[-1]["role"] == "user" and user_text in history[-1]["content"]:
        history = history[:-1]

    # 6. Invoke primary qwen2.5vl:3b model with mode-specific system prompt
    try:
        assistant_reply = await OllamaService.chat_with_text_model(
            user_message=user_text,
            conversation_history=history,
            response_language=target_language,
            image_base64=payload.image_base64,
            mode=payload.mode
        )
    except OllamaServiceException as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AAROGYA LINK AI service unavailable: {str(e)}"
        )

    # 7. Check if Refresh Memory occurred during model generation
    current_generation = ContextManager.get_memory_generation(consultation_id)
    if current_generation != request_generation:
        # Invalidate stale response - do not contaminate refreshed context
        return ChatMessageResponse(
            message_id=payload.client_message_id or str(uuid.uuid4()),
            sender="ai",
            senderName="AAROGYA LINK",
            timestamp=datetime.now().strftime("%I:%M %p"),
            text="Consultation memory was refreshed. Starting a fresh conversation.",
            consultation_id=consultation_id,
            interaction_mode=payload.mode,
            language=target_language
        )

    # 8. Record assistant response in canonical context.txt atomically
    reply_timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    ContextManager.append_entry(
        consultation_id=consultation_id,
        mode=payload.mode,
        speaker="ASSISTANT",
        content_type="RESPONSE",
        content=f"[{target_language}] {assistant_reply}",
        timestamp=reply_timestamp,
        expected_generation=request_generation
    )

    message_id = payload.client_message_id or str(uuid.uuid4())

    return ChatMessageResponse(
        message_id=message_id,
        sender="ai",
        senderName="AAROGYA LINK",
        timestamp=datetime.now().strftime("%I:%M %p"),
        text=assistant_reply,
        consultation_id=consultation_id,
        interaction_mode=payload.mode,
        language=target_language
    )
