from __future__ import annotations

from functools import lru_cache
from typing import List, Optional
from pydantic import field_validator, AnyHttpUrl
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App ────────────────────────────────────────────────
    APP_NAME: str = "SRP AI HRMS"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = "development"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    PORT: int = 8080
    HOST: str = "0.0.0.0"
    FRONTEND_URL: str = "http://localhost:3000"
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:3001"

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    # ── Database ───────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://srp_hrms:password@localhost:5432/srp_hrms"
    DATABASE_SYNC_URL: str = "postgresql://srp_hrms:password@localhost:5432/srp_hrms"
    DB_POOL_SIZE: int = 20
    DB_POOL_MAX_OVERFLOW: int = 40
    DB_POOL_TIMEOUT: int = 30
    DB_ECHO: bool = False

    # ── Redis ──────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_CACHE_TTL: int = 300
    TOKEN_BLACKLIST_TTL: int = 86400

    # ── JWT ────────────────────────────────────────────────
    JWT_SECRET_KEY: str = "CHANGE_ME_minimum_64_chars_random_secret_key_for_production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    JWT_RESET_TOKEN_EXPIRE_MINUTES: int = 60

    # ── Google OAuth ─────────────────────────────────────────
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: str = "https://api.hrms.srpailabs.com/api/v1/auth/google/callback"

    # ── NextAuth Internal Secret ──────────────────────────────
    NEXTAUTH_SECRET: Optional[str] = None

    # ── Super Admin ────────────────────────────────────────
    SUPER_ADMIN_EMAIL: str = "superadmin@srpailabs.com"
    SUPER_ADMIN_PASSWORD: str = "SuperAdmin@2026!"

    # ── File Storage ───────────────────────────────────────
    STORAGE_BACKEND: str = "local"
    S3_ENDPOINT_URL: Optional[str] = None
    S3_ACCESS_KEY_ID: Optional[str] = None
    S3_SECRET_ACCESS_KEY: Optional[str] = None
    S3_BUCKET_NAME: str = "srp-hrms"
    S3_REGION: str = "us-east-1"
    S3_USE_SSL: bool = False
    LOCAL_UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE_MB: int = 50

    # ── n8n ────────────────────────────────────────────────
    N8N_BASE_URL: str = "http://localhost:5678"
    N8N_API_KEY: Optional[str] = None
    N8N_WEBHOOK_SECRET: Optional[str] = None
    N8N_CANDIDATE_SCREENING_WEBHOOK: str = "/webhook/candidate-screening"
    N8N_HR_ASSISTANT_WEBHOOK: str = "/webhook/hr-assistant"
    N8N_ONBOARDING_WEBHOOK: str = "/webhook/employee-onboarding"
    N8N_ATTENDANCE_ALERT_WEBHOOK: str = "/webhook/attendance-alert"
    N8N_TIMEOUT_SECONDS: int = 30
    N8N_ENABLED: bool = False

    # ── Email ────────────────────────────────────────────-─
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_NAME: str = "SRP AI HRMS"
    SMTP_TLS: bool = True

    # ── Owner Notifications ────────────────────────────────
    # Telegram bot token from @BotFather
    TELEGRAM_BOT_TOKEN: Optional[str] = None
    # Your personal Telegram chat ID (send /start to bot, then GET /getUpdates)
    TELEGRAM_OWNER_CHAT_ID: Optional[str] = None
    # Email that receives all owner alerts
    OWNER_NOTIFICATION_EMAIL: Optional[str] = None

    # ── OpenAPI ────────────────────────────────────────────
    OPENAPI_TITLE: str = "SRP AI HRMS API"
    OPENAPI_DESCRIPTION: str = "Production-ready multi-tenant HRMS backend"
    DOCS_ENABLED: bool = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
