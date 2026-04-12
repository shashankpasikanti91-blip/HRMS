"""Schemas for organization settings, branches, designations."""
from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field


# ── Branch ────────────────────────────────────────────────────────────────

class BranchCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    code: Optional[str] = Field(None, max_length=50)
    branch_type: str = Field("branch", max_length=30)
    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    timezone: Optional[str] = Field(None, max_length=50)
    phone: Optional[str] = Field(None, max_length=30)
    email: Optional[str] = Field(None, max_length=255)
    manager_id: Optional[str] = None


class BranchUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    code: Optional[str] = Field(None, max_length=50)
    branch_type: Optional[str] = Field(None, max_length=30)
    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    timezone: Optional[str] = Field(None, max_length=50)
    phone: Optional[str] = Field(None, max_length=30)
    email: Optional[str] = Field(None, max_length=255)
    manager_id: Optional[str] = None


class BranchResponse(BaseModel):
    business_id: str
    name: str
    code: Optional[str] = None
    branch_type: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    timezone: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    manager_id: Optional[str] = None
    employee_count: int = 0
    is_active: bool = True
    created_at: Optional[str] = None


# ── Designation ───────────────────────────────────────────────────────────

class DesignationCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    code: Optional[str] = Field(None, max_length=50)
    level: Optional[int] = None
    description: Optional[str] = None


class DesignationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    code: Optional[str] = Field(None, max_length=50)
    level: Optional[int] = None
    description: Optional[str] = None


class DesignationResponse(BaseModel):
    business_id: str
    name: str
    code: Optional[str] = None
    level: Optional[int] = None
    description: Optional[str] = None
    is_active: bool = True


# ── Organization Settings ─────────────────────────────────────────────────

class OrganizationSettingsUpdate(BaseModel):
    working_days: Optional[list[int]] = None
    weekend_days: Optional[list[int]] = None
    work_start_time: Optional[str] = None
    work_end_time: Optional[str] = None
    daily_work_hours: Optional[float] = None
    weekly_work_hours: Optional[float] = None
    late_threshold_minutes: Optional[int] = None
    overtime_threshold_hours: Optional[float] = None
    overtime_multiplier: Optional[float] = None
    payroll_cycle: Optional[str] = None
    payroll_process_day: Optional[int] = Field(None, ge=1, le=31)
    default_currency: Optional[str] = Field(None, max_length=10)
    probation_period_days: Optional[int] = None
    notice_period_days: Optional[int] = None
    date_format: Optional[str] = None
    time_format: Optional[str] = None
    password_min_length: Optional[int] = Field(None, ge=6, le=32)
    password_require_uppercase: Optional[bool] = None
    password_require_number: Optional[bool] = None
    password_require_special: Optional[bool] = None
    password_expiry_days: Optional[int] = None
    enable_overtime: Optional[bool] = None
    enable_shifts: Optional[bool] = None
    enable_geo_tracking: Optional[bool] = None
    enable_client_billing: Optional[bool] = None
    enable_telegram_bot: Optional[bool] = None
    custom_config: Optional[dict[str, Any]] = None


class OrganizationSettingsResponse(BaseModel):
    business_id: str
    company_id: str
    working_days: Optional[list[int]] = None
    weekend_days: Optional[list[int]] = None
    work_start_time: Optional[str] = None
    work_end_time: Optional[str] = None
    daily_work_hours: float = 8.0
    weekly_work_hours: float = 40.0
    late_threshold_minutes: int = 15
    overtime_threshold_hours: float = 8.0
    overtime_multiplier: float = 1.5
    payroll_cycle: str = "monthly"
    payroll_process_day: int = 28
    default_currency: str = "INR"
    probation_period_days: int = 90
    notice_period_days: int = 30
    date_format: str = "DD/MM/YYYY"
    time_format: str = "24h"
    password_min_length: int = 8
    password_require_uppercase: bool = True
    password_require_number: bool = True
    password_require_special: bool = True
    password_expiry_days: int = 0
    enable_overtime: bool = True
    enable_shifts: bool = False
    enable_geo_tracking: bool = False
    enable_client_billing: bool = False
    enable_telegram_bot: bool = False
    custom_config: Optional[dict[str, Any]] = None
