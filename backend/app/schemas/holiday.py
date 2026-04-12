from __future__ import annotations

from datetime import date
from typing import Optional

from app.schemas.base import BaseSchema, BaseResponse


class HolidayCreate(BaseSchema):
    name: str
    date: date
    holiday_type: str = "public"  # public, restricted, optional
    country: Optional[str] = None
    state: Optional[str] = None
    description: Optional[str] = None
    is_paid: bool = True


class HolidayUpdate(BaseSchema):
    name: Optional[str] = None
    date: Optional[date] = None
    holiday_type: Optional[str] = None
    country: Optional[str] = None
    state: Optional[str] = None
    description: Optional[str] = None
    is_paid: Optional[bool] = None


class HolidayResponse(BaseResponse):
    company_id: str
    name: str
    date: date
    holiday_type: str
    country: Optional[str] = None
    state: Optional[str] = None
    description: Optional[str] = None
    is_paid: bool = True
