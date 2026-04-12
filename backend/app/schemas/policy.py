"""Schemas for policy engine: leave policies, attendance policies, country/state configs."""
from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field


# ── Leave Policy ──────────────────────────────────────────────────────────

class LeavePolicyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    is_default: bool = False


class LeavePolicyUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    is_default: Optional[bool] = None


class LeavePolicyResponse(BaseModel):
    business_id: str
    name: str
    description: Optional[str] = None
    is_default: bool = False
    is_active: bool = True


# ── Leave Type ────────────────────────────────────────────────────────────

class LeaveTypeCreate(BaseModel):
    leave_policy_id: str
    name: str = Field(..., min_length=1, max_length=100)
    code: str = Field(..., min_length=1, max_length=20)
    annual_quota: float = Field(0, ge=0)
    max_consecutive_days: Optional[int] = Field(None, ge=1)
    min_days_per_request: float = Field(0.5, ge=0.5)
    is_paid: bool = True
    is_carry_forward: bool = False
    max_carry_forward: Optional[float] = Field(None, ge=0)
    accrual_frequency: str = "monthly"
    requires_approval: bool = True
    requires_attachment: bool = False
    min_attachment_days: Optional[int] = None
    applicable_gender: Optional[str] = None
    probation_eligible: bool = False
    encashable: bool = False
    color: Optional[str] = None


class LeaveTypeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    annual_quota: Optional[float] = Field(None, ge=0)
    max_consecutive_days: Optional[int] = Field(None, ge=1)
    is_paid: Optional[bool] = None
    is_carry_forward: Optional[bool] = None
    max_carry_forward: Optional[float] = Field(None, ge=0)
    accrual_frequency: Optional[str] = None
    requires_approval: Optional[bool] = None
    requires_attachment: Optional[bool] = None
    min_attachment_days: Optional[int] = None
    applicable_gender: Optional[str] = None
    probation_eligible: Optional[bool] = None
    encashable: Optional[bool] = None
    color: Optional[str] = None


class LeaveTypeResponse(BaseModel):
    business_id: str
    leave_policy_id: str
    name: str
    code: str
    annual_quota: float = 0
    max_consecutive_days: Optional[int] = None
    min_days_per_request: float = 0.5
    is_paid: bool = True
    is_carry_forward: bool = False
    max_carry_forward: Optional[float] = None
    accrual_frequency: str = "monthly"
    requires_approval: bool = True
    requires_attachment: bool = False
    applicable_gender: Optional[str] = None
    probation_eligible: bool = False
    encashable: bool = False
    color: Optional[str] = None
    is_active: bool = True


# ── Leave Balance ─────────────────────────────────────────────────────────

class LeaveBalanceResponse(BaseModel):
    business_id: str
    employee_id: str
    leave_type_id: str
    leave_type_name: Optional[str] = None
    leave_type_code: Optional[str] = None
    year: int
    allocated: float = 0
    used: float = 0
    pending: float = 0
    carried_forward: float = 0
    available: float = 0


# ── Attendance Policy ─────────────────────────────────────────────────────

class AttendancePolicyUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    check_in_required: Optional[bool] = None
    auto_checkout: Optional[bool] = None
    auto_checkout_time: Optional[str] = None
    allow_manual_entry: Optional[bool] = None
    require_approval_for_corrections: Optional[bool] = None
    track_breaks: Optional[bool] = None
    max_break_minutes: Optional[int] = None
    grace_period_minutes: Optional[int] = Field(None, ge=0, le=120)
    half_day_hours: Optional[float] = Field(None, ge=1.0, le=12.0)
    min_hours_for_full_day: Optional[float] = Field(None, ge=1.0, le=24.0)
    enable_geo_fencing: Optional[bool] = None
    geo_fence_radius_meters: Optional[int] = None
    allowed_check_in_methods: Optional[list[str]] = None
    rules_config: Optional[dict] = None


class AttendancePolicyResponse(BaseModel):
    business_id: str
    company_id: str
    name: str
    check_in_required: bool = True
    auto_checkout: bool = False
    auto_checkout_time: Optional[str] = None
    allow_manual_entry: bool = True
    require_approval_for_corrections: bool = True
    track_breaks: bool = False
    max_break_minutes: Optional[int] = None
    grace_period_minutes: int = 15
    half_day_hours: float = 4.0
    min_hours_for_full_day: float = 7.0
    enable_geo_fencing: bool = False
    geo_fence_radius_meters: Optional[int] = None
    allowed_check_in_methods: Optional[list[str]] = None


# ── Country Config ────────────────────────────────────────────────────────

class CountryConfigResponse(BaseModel):
    business_id: str
    country_code: str
    country_name: str
    currency_code: str
    currency_symbol: str
    date_format: str
    timezone: str
    default_weekend_days: Optional[list[int]] = None
    default_work_hours: float = 8.0
    minimum_wage: Optional[float] = None
