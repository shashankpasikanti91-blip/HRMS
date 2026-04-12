from __future__ import annotations

from datetime import date, datetime
from typing import Optional
from pydantic import EmailStr, model_validator

from app.schemas.base import BaseSchema, BaseResponse
from app.utils.enums import EmploymentType, WorkMode, EmploymentStatus, Gender


class DepartmentCreate(BaseSchema):
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    parent_department_id: Optional[str] = None
    head_employee_id: Optional[str] = None


class DepartmentUpdate(BaseSchema):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    parent_department_id: Optional[str] = None
    head_employee_id: Optional[str] = None


class DepartmentResponse(BaseResponse):
    company_id: str
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    parent_department_id: Optional[str] = None
    head_employee_id: Optional[str] = None
    employee_count: Optional[int] = None


class DepartmentSummary(BaseSchema):
    id: str
    business_id: str
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    employee_count: int = 0


# ── Employee ───────────────────────────────────────────────────────────────

class EmployeeCreate(BaseSchema):
    full_name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    work_email: Optional[EmailStr] = None
    email: Optional[EmailStr] = None
    personal_email: Optional[EmailStr] = None
    phone: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    gender: Optional[Gender] = None
    date_of_birth: Optional[date] = None
    joining_date: Optional[date] = None
    date_of_joining: Optional[date] = None
    employment_type: Optional[EmploymentType] = EmploymentType.FULL_TIME
    work_mode: Optional[WorkMode] = WorkMode.ONSITE
    department_id: Optional[str] = None
    user_id: Optional[str] = None
    designation: Optional[str] = None
    manager_id: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    employee_code: Optional[str] = None  # auto-generated if omitted

    @model_validator(mode="after")
    def normalize_legacy_fields(self):
        if not self.work_email and self.email:
            self.work_email = self.email
        if not self.joining_date and self.date_of_joining:
            self.joining_date = self.date_of_joining
        if not self.full_name:
            combined_name = " ".join(part for part in [self.first_name, self.last_name] if part).strip()
            self.full_name = combined_name or None
        if not self.full_name:
            raise ValueError("full_name is required")
        if not self.work_email:
            raise ValueError("work_email or email is required")
        return self


class EmployeeUpdate(BaseSchema):
    full_name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    personal_email: Optional[EmailStr] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    gender: Optional[Gender] = None
    date_of_birth: Optional[date] = None
    joining_date: Optional[date] = None
    employment_type: Optional[EmploymentType] = None
    work_mode: Optional[WorkMode] = None
    department_id: Optional[str] = None
    designation: Optional[str] = None
    manager_id: Optional[str] = None
    location: Optional[str] = None
    employment_status: Optional[EmploymentStatus] = None
    notes: Optional[str] = None
    profile_photo_url: Optional[str] = None


class EmployeeResponse(BaseResponse):
    company_id: str
    user_id: Optional[str] = None
    employee_code: str
    full_name: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    work_email: str
    personal_email: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    joining_date: Optional[date] = None
    employment_type: Optional[str] = None
    work_mode: Optional[str] = None
    department_id: Optional[str] = None
    department_name: Optional[str] = None
    designation: Optional[str] = None
    manager_id: Optional[str] = None
    manager_name: Optional[str] = None
    employment_status: str
    location: Optional[str] = None
    profile_photo_url: Optional[str] = None
    documents_count: int = 0


class EmployeeSummary(BaseSchema):
    id: str
    business_id: str
    employee_code: str
    full_name: str
    work_email: str
    designation: Optional[str] = None
    department_name: Optional[str] = None
    employment_status: str


class EmployeeSummaryDetail(EmployeeResponse):
    """Extended employee response with linked data."""
    today_attendance_status: Optional[str] = None
    pending_leaves: int = 0
    manager_name: Optional[str] = None
    department_name: Optional[str] = None
