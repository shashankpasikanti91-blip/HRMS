from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Optional, List

from pydantic import Field

from app.schemas.base import BaseSchema, BaseResponse


# ─── Policy Schemas ──────────────────────────────────────────────────────────


class LOPPolicyUpdate(BaseSchema):
    working_days_per_month: Optional[int] = Field(None, ge=1, le=31)
    use_calendar_days: Optional[bool] = None
    late_grace_count: Optional[int] = Field(None, ge=0)
    lates_per_half_day: Optional[int] = Field(None, ge=1)
    apply_lop_on_absent: Optional[bool] = None
    round_to_half_day: Optional[bool] = None
    max_lop_days_per_month: Optional[int] = Field(None, ge=0)
    description: Optional[str] = None


class LOPPolicyResponse(BaseResponse):
    company_id: str
    working_days_per_month: int
    use_calendar_days: bool
    late_grace_count: int
    lates_per_half_day: int
    apply_lop_on_absent: bool
    round_to_half_day: bool
    max_lop_days_per_month: Optional[int]
    description: Optional[str]
    is_active: bool


# ─── Record Schemas ───────────────────────────────────────────────────────────


class LOPRecordResponse(BaseResponse):
    company_id: str
    employee_id: str
    employee_name: Optional[str] = None
    employee_code: Optional[str] = None
    year: int
    month: int
    total_working_days: int
    days_present: int
    days_absent: int
    days_on_approved_leave: int
    late_count: int
    lop_from_absence: Decimal
    lop_from_lates: Decimal
    total_lop_days: Decimal
    final_lop_days: Decimal
    per_day_amount: Optional[Decimal]
    total_lop_amount: Optional[Decimal]
    currency: str
    status: str
    approved_by: Optional[str]
    approved_at: Optional[date]
    notes: Optional[str]
    override_id: Optional[str]


# ─── Override Schemas ─────────────────────────────────────────────────────────


class LOPOverrideCreate(BaseSchema):
    employee_id: str
    year: int
    month: int = Field(..., ge=1, le=12)
    original_lop_days: Decimal = Field(..., ge=0)
    adjusted_lop_days: Decimal = Field(..., ge=0)
    reason: str = Field(..., min_length=5)


class LOPOverrideResponse(BaseSchema):
    id: str
    business_id: str
    company_id: str
    employee_id: str
    employee_name: Optional[str] = None
    year: int
    month: int
    original_lop_days: Decimal
    adjusted_lop_days: Decimal
    reason: str
    status: str
    approved_by: Optional[str]
    approved_at: Optional[date]

    class Config:
        from_attributes = True
