from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.pagination import PaginationParams, Page
from app.models.user import User
from app.schemas.document import DocumentCreate, DocumentResponse, NotificationResponse
from app.services.document_service import DocumentService, NotificationService

doc_router = APIRouter(prefix="/documents", tags=["Documents"])
notif_router = APIRouter(prefix="/notifications", tags=["Notifications"])


# ── Documents ──────────────────────────────────────────────────────────────

@doc_router.post("", response_model=DocumentResponse, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    employee_id: Optional[str] = Form(None),
    document_type: str = Form(...),
    title: str = Form(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a document file."""
    svc = DocumentService(db)
    data = DocumentCreate(
        employee_id=employee_id,
        document_type=document_type,
        title=title,
        file_name=file.filename or title,
    )
    doc = await svc.upload(file, data, current_user.company_id, current_user.id)
    return DocumentResponse.model_validate(doc)


@doc_router.get("", response_model=Page[DocumentResponse])
async def list_documents(
    params: PaginationParams = Depends(),
    employee_id: Optional[str] = Query(None),
    document_type: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = DocumentService(db)
    docs, total = await svc.list(
        current_user.company_id, params, employee_id=employee_id, document_type=document_type
    )
    return Page.create([DocumentResponse.model_validate(d) for d in docs], total, params)


@doc_router.get("/{business_id}", response_model=DocumentResponse)
async def get_document(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = DocumentService(db)
    doc = await svc.get(business_id, current_user.company_id)
    return DocumentResponse.model_validate(doc)


@doc_router.delete("/{business_id}", status_code=204)
async def delete_document(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = DocumentService(db)
    await svc.delete(business_id, current_user.company_id)


# ── Notifications ──────────────────────────────────────────────────────────

@notif_router.get("", response_model=Page[NotificationResponse])
async def list_notifications(
    params: PaginationParams = Depends(),
    unread_only: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = NotificationService(db)
    notifs, total = await svc.list_for_user(
        current_user.id, current_user.company_id, params, unread_only=unread_only
    )
    return Page.create([NotificationResponse.model_validate(n) for n in notifs], total, params)


@notif_router.put("/{business_id}/read", response_model=NotificationResponse)
async def mark_notification_read(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = NotificationService(db)
    notif = await svc.mark_read(business_id, current_user.id, current_user.company_id)
    return NotificationResponse.model_validate(notif)


@notif_router.put("/read-all", response_model=dict)
async def mark_all_notifications_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = NotificationService(db)
    count = await svc.mark_all_read(current_user.id, current_user.company_id)
    return {"marked_read": count}
