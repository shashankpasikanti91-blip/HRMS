from __future__ import annotations

from datetime import datetime
from typing import Any, Generic, List, Optional, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class TimestampSchema(BaseSchema):
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class BaseResponse(TimestampSchema):
    id: str
    business_id: str
    is_active: bool = True


class MessageResponse(BaseSchema):
    message: str
    success: bool = True


class PaginationMeta(BaseSchema):
    page: int
    page_size: int
    total: int
    total_pages: int
    has_next: bool
    has_prev: bool


class PaginatedResponse(BaseSchema, Generic[T]):
    data: List[T]
    meta: PaginationMeta
