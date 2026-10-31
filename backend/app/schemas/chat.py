from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class ChatMessageRequest(BaseModel):
    consultation_id: str = Field(..., description="Unique consultation ID")
    message: str = Field(..., min_length=1, description="Patient symptom or query")
    mode: str = Field("text", description="Interaction mode (text, virtual_doctor, speech)")
    client_message_id: Optional[str] = None
    language: Optional[str] = Field(None, description="Requested response language from UI or Auto")
    image_base64: Optional[str] = Field(None, description="Optional uploaded image in base64")

class ChatMessageResponse(BaseModel):
    message_id: str
    sender: str = "ai"
    senderName: str = "AAROGYA LINK"
    timestamp: str
    text: str
    consultation_id: str
    interaction_mode: str = "text"
    language: str = "English"

class RefreshMemoryRequest(BaseModel):
    consultation_id: str

class RefreshMemoryResponse(BaseModel):
    success: bool
    message: str
    consultation_id: str
    reconstructed_at: str

class VisionAnalysisRequest(BaseModel):
    consultation_id: str
    image_base64: str
    prompt: Optional[str] = None
    language: Optional[str] = None

class VisionAnalysisResponse(BaseModel):
    consultation_id: str
    observation: str
    timestamp: str
    language: str = "English"
