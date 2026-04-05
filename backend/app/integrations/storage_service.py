from __future__ import annotations

import os
import uuid
from pathlib import Path
from typing import Optional

import aiofiles
from fastapi import UploadFile

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class StorageService:
    """
    Abstracted file storage. Supports 'local' and 's3'/'minio' backends.
    Switch via STORAGE_BACKEND env var.
    """

    @classmethod
    async def upload(
        cls,
        file: UploadFile,
        folder: str = "uploads",
        company_id: Optional[str] = None,
    ) -> str:
        """Upload a file and return its public URL."""
        ext = Path(file.filename or "file").suffix.lower()
        unique_name = f"{uuid.uuid4().hex}{ext}"
        path_parts = filter(None, [folder, company_id, unique_name])
        key = "/".join(path_parts)

        if settings.STORAGE_BACKEND == "local":
            return await cls._upload_local(file, key)
        return await cls._upload_s3(file, key)

    @classmethod
    async def _upload_local(cls, file: UploadFile, key: str) -> str:
        upload_dir = Path(settings.LOCAL_UPLOAD_DIR)
        dest = upload_dir / key
        dest.parent.mkdir(parents=True, exist_ok=True)

        content = await file.read()
        async with aiofiles.open(dest, "wb") as f:
            await f.write(content)

        logger.info("File saved locally", path=str(dest))
        return f"/static/{key}"

    @classmethod
    async def _upload_s3(cls, file: UploadFile, key: str) -> str:
        try:
            import boto3
            from botocore.config import Config

            s3_config: dict = {"region_name": settings.S3_REGION}
            if settings.S3_ENDPOINT_URL:
                s3_config["endpoint_url"] = settings.S3_ENDPOINT_URL

            s3 = boto3.client(
                "s3",
                aws_access_key_id=settings.S3_ACCESS_KEY_ID,
                aws_secret_access_key=settings.S3_SECRET_ACCESS_KEY,
                **s3_config,
            )
            content = await file.read()
            s3.put_object(
                Bucket=settings.S3_BUCKET_NAME,
                Key=key,
                Body=content,
                ContentType=file.content_type or "application/octet-stream",
            )
            endpoint = settings.S3_ENDPOINT_URL or f"https://s3.amazonaws.com"
            url = f"{endpoint}/{settings.S3_BUCKET_NAME}/{key}"
            logger.info("File uploaded to S3", key=key)
            return url
        except Exception as e:
            logger.error("S3 upload failed", error=str(e))
            raise

    @classmethod
    async def delete(cls, file_url: str) -> None:
        """Delete a file. Best effort, does not raise."""
        try:
            if settings.STORAGE_BACKEND == "local":
                if file_url.startswith("/static/"):
                    path = Path(settings.LOCAL_UPLOAD_DIR) / file_url[len("/static/"):]
                    if path.exists():
                        path.unlink()
        except Exception as e:
            logger.warning("File delete failed", url=file_url, error=str(e))


storage = StorageService()
