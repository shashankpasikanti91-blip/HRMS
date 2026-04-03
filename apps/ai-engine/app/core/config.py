from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # App
    APP_NAME: str = "SRP AI Engine"
    PORT: int = 8000
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:4000",
    ]

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/srp_hrms"
    DATABASE_SYNC_URL: str = "postgresql://postgres:postgres@localhost:5432/srp_hrms"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # NATS
    NATS_URL: str = "nats://localhost:4222"

    # OpenAI / OpenRouter
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENAI_MODEL: str = "openai/gpt-4o-mini"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    OPENROUTER_API_KEY: str = ""

    # Vector Store
    VECTOR_STORE_PATH: str = "./data/vector_store"
    EMBEDDING_DIMENSION: int = 1536

    # MinIO / S3
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET: str = "hrms-documents"

    # ML Model paths
    RESUME_MODEL_PATH: str = "./data/models/resume_classifier"
    ATTRITION_MODEL_PATH: str = "./data/models/attrition_predictor"

    class Config:
        env_file = "../../.env"
        case_sensitive = True


settings = Settings()
