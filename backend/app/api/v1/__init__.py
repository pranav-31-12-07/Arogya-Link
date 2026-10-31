from fastapi import APIRouter
from .chat import router as chat_router
from .consultations import router as consultations_router

api_router = APIRouter()
api_router.include_router(chat_router)
api_router.include_router(consultations_router)

__all__ = ["api_router"]
