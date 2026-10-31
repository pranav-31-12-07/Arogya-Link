from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .api import api_router
from .services.ollama_service import OllamaService

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AAROGYA LINK Telehealth AI & Consultation Orchestration Backend",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 routes
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "project": "AAROGYA LINK",
        "status": "online",
        "api_docs": "/docs"
    }

@app.get("/api/v1/health")
async def health_check():
    ollama_health = await OllamaService.check_health()
    return {
        "service": "aarogya-link-backend",
        "status": "healthy",
        "ollama": ollama_health
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
