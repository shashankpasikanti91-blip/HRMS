from __future__ import annotations

from typing import Optional

from app.schemas.base import BaseSchema, BaseResponse


class DocumentResponse(BaseResponse):
    company_id: str
    employee_id: Optional[str] = None
    candidate_id: Optional[str] = None
    document_type: Optional[str] = None
    file_name: str
    file_url: str
    mime_type: Optional[str] = None
    file_size: Optional[int] = None
    uploaded_by: Optional[str] = None
    verification_status: str
    description: Optional[str] = None


class DocumentCreate(BaseSchema):
    """Used when creating a document record (metadata only; file upload uses Form fields)."""
    employee_id: Optional[str] = None
    candidate_id: Optional[str] = None
    document_type: Optional[str] = None
    title: Optional[str] = None
    file_name: Optional[str] = None
    description: Optional[str] = None


class NotificationResponse(BaseResponse):
    company_id: str
    user_id: str
    title: str
    message: Optional[str] = None
    category: str
    is_read: bool
    action_url: Optional[str] = None
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None


class NotificationCreate(BaseSchema):
    user_id: str
    title: str
    message: Optional[str] = None
    category: str = "system"
    action_url: Optional[str] = None
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None


class NotificationMarkRead(BaseSchema):
    pass  # no body needed, business_id comes from path
