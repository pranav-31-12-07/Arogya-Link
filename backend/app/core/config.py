import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "AAROGYA LINK Backend"
    API_V1_STR: str = "/api/v1"
    
    # Ollama Local Runtime Settings - Switched primary model to qwen2.5vl:3b
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    PRIMARY_MODEL: str = os.getenv("PRIMARY_MODEL", "qwen2.5vl:3b")
    TEXT_MODEL: str = os.getenv("TEXT_MODEL", os.getenv("PRIMARY_MODEL", "qwen2.5vl:3b"))
    VISION_MODEL: str = os.getenv("VISION_MODEL", os.getenv("PRIMARY_MODEL", "qwen2.5vl:3b"))
    OLLAMA_TIMEOUT: float = float(os.getenv("OLLAMA_TIMEOUT", "120.0"))
    
    # Storage Settings
    STORAGE_DIR: Path = BASE_DIR / "storage" / "consultations"
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ]

    class Config:
        case_sensitive = True

settings = Settings()

# Ensure storage directory exists
settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
