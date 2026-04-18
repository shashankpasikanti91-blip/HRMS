from __future__ import annotations

import logging
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import get_settings
from app.core.database import engine, Base
from app.core.exceptions import AppException
from app.core.logging import configure_logging
from app.middleware import TenantMiddleware, AuditMiddleware, SecurityHeadersMiddleware
from app.api.v1 import api_router

settings = get_settings()
configure_logging("INFO")
logger = structlog.get_logger(__name__)

# ── Rate Limiter (global instance) ─────────────────────────────────────────
from app.core.rate_limit import limiter


# ── Lifespan ────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("startup", env=settings.ENVIRONMENT, version=settings.APP_VERSION)
    # Tables are managed by Alembic in production; auto-create only in dev
    if settings.APP_ENV == "development":
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("dev_tables_synced")
    yield
    logger.info("shutdown")
    await engine.dispose()


# ── App factory ─────────────────────────────────────────────────────────────

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description=(
            "SRP AI HRMS — Multi-tenant Human Resource Management SaaS. "
            "Every entity has a unique searchable Business ID (EMP-000001, COMP-000001, …). "
            "Powered by FastAPI + PostgreSQL + Redis + n8n AI."
        ),
        docs_url="/docs" if settings.DOCS_ENABLED else None,
        redoc_url="/redoc" if settings.DOCS_ENABLED else None,
        openapi_url="/openapi.json" if settings.DOCS_ENABLED else None,
        lifespan=lifespan,
    )

    # ── CORS ──────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,  # type: ignore[arg-type]
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID", "X-Response-Time"],
    )

    # ── Custom middleware (outermost first) ───────────────────────────────
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(TenantMiddleware)
    app.add_middleware(AuditMiddleware)

    # ── Rate limiter ─────────────────────────────────────────────────────
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # ── Exception handlers ─────────────────────────────────────────────────
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
        request_id = getattr(request.state, "request_id", None)
        logger.warning(
            "app_error",
            path=request.url.path,
            method=request.method,
            status_code=exc.status_code,
            code=getattr(exc, "error_code", "APP_ERROR"),
            detail=exc.detail,
            request_id=request_id,
        )
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "detail": exc.detail,
                "code": getattr(exc, "error_code", getattr(exc, "code", "APP_ERROR")),
                "request_id": request_id,
            },
            headers=exc.headers,
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        request_id = getattr(request.state, "request_id", None)
        logger.exception(
            "unhandled_error",
            path=request.url.path,
            method=request.method,
            exc=str(exc),
            request_id=request_id,
        )
        return JSONResponse(
            status_code=500,
            content={
                "detail": "An unexpected error occurred.",
                "code": "INTERNAL_SERVER_ERROR",
                "request_id": request_id,
            },
        )

    # ── Static files (uploaded documents) ─────────────────────────────────
    import os
    os.makedirs(settings.LOCAL_UPLOAD_DIR, exist_ok=True)
    app.mount("/files", StaticFiles(directory=settings.LOCAL_UPLOAD_DIR), name="files")

    # ── Routers ────────────────────────────────────────────────────────────
    app.include_router(api_router)

    # ── Health check ───────────────────────────────────────────────────────
    @app.get("/health", tags=["Health"], include_in_schema=False)
    async def health_check():
        return {"status": "ok", "version": settings.APP_VERSION, "env": settings.APP_ENV}

    @app.get("/", tags=["Root"], include_in_schema=False)
    async def root():
        return {
            "service": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "docs": "/docs",
        }

    return app


app = create_app()
