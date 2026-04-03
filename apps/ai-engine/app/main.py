from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.api.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print(f"🤖 SRP AI Engine starting on port {settings.PORT}")
    yield
    # Shutdown
    print("🤖 SRP AI Engine shutting down")


app = FastAPI(
    title="SRP AI HRMS - AI Engine",
    description="AI-powered services: RAG chatbot, resume screening, predictive analytics, document intelligence",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "ai-engine",
        "version": "1.0.0",
    }
