from __future__ import annotations

from functools import lru_cache
from typing import Any, Dict, List, Optional
from pydantic import field_validator, model_validator
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
    # Also accepts CORS_ORIGINS (alias used in .env.production)
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:3001"

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    # ── Database ───────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://srp_hrms:password@localhost:5432/srp_hrms"
    DATABASE_SYNC_URL: str = "postgresql://srp_hrms:password@localhost:5432/srp_hrms"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def ensure_async_driver(cls, v: str) -> str:
        """Ensure DATABASE_URL uses the asyncpg async driver."""
        if isinstance(v, str) and v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    DB_POOL_SIZE: int = 20
    DB_POOL_MAX_OVERFLOW: int = 40
    DB_POOL_TIMEOUT: int = 30
    DB_ECHO: bool = False

    # ── Redis ──────────────────────────────────────────────
    # Built from REDIS_HOST/REDIS_PORT/REDIS_PASSWORD if not set directly
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_CACHE_TTL: int = 300
    TOKEN_BLACKLIST_TTL: int = 86400

    # ── JWT ────────────────────────────────────────────────
    # Also accepts FASTAPI_SECRET_KEY (alias used in .env.production)
    JWT_SECRET_KEY: str = "CHANGE_ME_minimum_64_chars_random_secret_key_for_production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    JWT_RESET_TOKEN_EXPIRE_MINUTES: int = 60

    @model_validator(mode="before")
    @classmethod
    def _resolve_env_aliases(cls, values: Dict[str, Any]) -> Dict[str, Any]:
        """
        Resolve legacy / alternate env var names used in .env.production
        so the backend works without renaming the env file.
        """
        # CORS: CORS_ORIGINS -> ALLOWED_ORIGINS
        cors = values.get("cors_origins") or values.get("CORS_ORIGINS")
        if cors and not (values.get("allowed_origins") or values.get("ALLOWED_ORIGINS")):
            values["ALLOWED_ORIGINS"] = cors

        # JWT: FASTAPI_SECRET_KEY -> JWT_SECRET_KEY
        fsk = values.get("fastapi_secret_key") or values.get("FASTAPI_SECRET_KEY")
        if fsk and not (values.get("jwt_secret_key") or values.get("JWT_SECRET_KEY")):
            values["JWT_SECRET_KEY"] = fsk

        # Redis: build REDIS_URL from components when not set as full URL
        current_url = values.get("redis_url") or values.get("REDIS_URL", "")
        if not current_url or current_url == "redis://localhost:6379/0":
            host = values.get("redis_host") or values.get("REDIS_HOST", "")
            port = values.get("redis_port") or values.get("REDIS_PORT", 6379)
            pw = values.get("redis_password") or values.get("REDIS_PASSWORD", "")
            if host and host not in ("localhost", "127.0.0.1"):
                if pw:
                    values["REDIS_URL"] = f"redis://:{pw}@{host}:{port}/0"
                else:
                    values["REDIS_URL"] = f"redis://{host}:{port}/0"

        return values

    # ── Google OAuth ─────────────────────────────────────────
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: str = "https://api.hrms.srpailabs.com/api/v1/auth/google/callback"

    # ── NextAuth Internal Secret ──────────────────────────────
    NEXTAUTH_SECRET: Optional[str] = None

    # ── Super Admin ────────────────────────────────────────
    # Accepts both SUPER_ADMIN_EMAIL and FASTAPI_SUPER_ADMIN_EMAIL (legacy)
    SUPER_ADMIN_EMAIL: str = "superadmin@srpailabs.com"
    SUPER_ADMIN_PASSWORD: str = "SuperAdmin@2026!"
    FASTAPI_SUPER_ADMIN_EMAIL: Optional[str] = None
    FASTAPI_SUPER_ADMIN_PASSWORD: Optional[str] = None

    @property
    def effective_super_admin_email(self) -> str:
        return self.FASTAPI_SUPER_ADMIN_EMAIL or self.SUPER_ADMIN_EMAIL

    @property
    def effective_super_admin_password(self) -> str:
        return self.FASTAPI_SUPER_ADMIN_PASSWORD or self.SUPER_ADMIN_PASSWORD

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

    # ── OpenAI / AI ────────────────────────────────────────
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_BASE_URL: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENROUTER_API_KEY: Optional[str] = None

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
