from fastapi import APIRouter
from app.api.endpoints import chat, resume, predictions, documents, analytics

api_router = APIRouter()

api_router.include_router(chat.router, prefix="/chat", tags=["AI Chat"])
api_router.include_router(resume.router, prefix="/resume", tags=["Resume Screening"])
api_router.include_router(predictions.router, prefix="/predictions", tags=["Predictive Analytics"])
api_router.include_router(documents.router, prefix="/documents", tags=["Document Intelligence"])
api_router.include_router(analytics.router, prefix="/ai-analytics", tags=["AI Analytics"])
