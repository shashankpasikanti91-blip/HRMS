from __future__ import annotations

import os
import uuid
from pathlib import Path
from typing import Optional

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.notification import Document, Notification
from app.schemas.document import DocumentCreate, NotificationCreate
from app.services.business_id_service import BusinessIdService
from app.integrations.storage_service import StorageService
from app.core.exceptions import NotFoundException
from app.core.pagination import PaginationParams


class DocumentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def upload(
        self,
        file: UploadFile,
        data: DocumentCreate,
        company_id: str,
        uploaded_by: str,
    ) -> Document:
        storage = StorageService()
        file_url = await storage.upload(file, folder="documents", company_id=company_id)

        doc = Document(
            business_id=await BusinessIdService.generate(self.db, "document"),
            company_id=company_id,
            created_by=uploaded_by,
            updated_by=uploaded_by,
            file_url=file_url,
            file_name=file.filename or data.file_name,
            file_size=file.size or 0,
            mime_type=file.content_type or "application/octet-stream",
            **data.model_dump(exclude={"file_name"}),
        )
        self.db.add(doc)
        await self.db.commit()
        await self.db.refresh(doc)
        return doc

    async def list(
        self,
        company_id: str,
        params: PaginationParams,
        employee_id: Optional[str] = None,
        document_type: Optional[str] = None,
    ) -> tuple[list[Document], int]:
        q = select(Document).where(
            Document.company_id == company_id,
            Document.is_deleted == False,
        )
        if employee_id:
            q = q.where(Document.employee_id == employee_id)
        if document_type:
            q = q.where(Document.document_type == document_type)

        count_q = select(func.count()).select_from(q.subquery())
        total = (await self.db.execute(count_q)).scalar_one()

        q = q.order_by(Document.created_at.desc()).offset(params.skip).limit(params.limit)
        result = await self.db.execute(q)
        return list(result.scalars().all()), total

    async def get(self, business_id: str, company_id: str) -> Document:
        result = await self.db.execute(
            select(Document).where(
                Document.business_id == business_id,
                Document.company_id == company_id,
                Document.is_deleted == False,
            )
        )
        doc = result.scalar_one_or_none()
        if not doc:
            raise NotFoundException(f"Document {business_id} not found")
        return doc

    async def delete(self, business_id: str, company_id: str) -> None:
        doc = await self.get(business_id, company_id)
        doc.is_deleted = True
        await self.db.commit()


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        data: NotificationCreate,
        company_id: str,
        created_by: str,
    ) -> Notification:
        notif = Notification(
            business_id=await BusinessIdService.generate(self.db, "notification"),
            company_id=company_id,
            created_by=created_by,
            updated_by=created_by,
            **data.model_dump(),
        )
        self.db.add(notif)
        await self.db.commit()
        await self.db.refresh(notif)
        return notif

    async def list_for_user(
        self,
        user_id: str,
        company_id: str,
        params: PaginationParams,
        unread_only: bool = False,
    ) -> tuple[list[Notification], int]:
        q = select(Notification).where(
            Notification.user_id == user_id,
            Notification.company_id == company_id,
            Notification.is_deleted == False,
        )
        if unread_only:
            q = q.where(Notification.is_read == False)

        count_q = select(func.count()).select_from(q.subquery())
        total = (await self.db.execute(count_q)).scalar_one()

        q = q.order_by(Notification.created_at.desc()).offset(params.skip).limit(params.limit)
        result = await self.db.execute(q)
        return list(result.scalars().all()), total

    async def mark_read(self, business_id: str, user_id: str, company_id: str) -> Notification:
        result = await self.db.execute(
            select(Notification).where(
                Notification.business_id == business_id,
                Notification.user_id == user_id,
                Notification.company_id == company_id,
                Notification.is_deleted == False,
            )
        )
        notif = result.scalar_one_or_none()
        if not notif:
            raise NotFoundException(f"Notification {business_id} not found")
        notif.is_read = True
        await self.db.commit()
        await self.db.refresh(notif)
        return notif

    async def mark_all_read(self, user_id: str, company_id: str) -> int:
        from sqlalchemy import update
        stmt = (
            update(Notification)
            .where(
                Notification.user_id == user_id,
                Notification.company_id == company_id,
                Notification.is_read == False,
                Notification.is_deleted == False,
            )
            .values(is_read=True)
        )
        result = await self.db.execute(stmt)
        await self.db.commit()
        return result.rowcount
