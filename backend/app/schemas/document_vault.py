"""Pydantic schemas for document vault, onboarding checklists, and bank accounts."""
from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional

from pydantic import field_validator, model_validator

from app.schemas.base import BaseSchema, BaseResponse


# ──────────────────────────────────────────────────────────────────────────────
# Document Type Templates
# ──────────────────────────────────────────────────────────────────────────────

class DocumentTypeTemplateCreate(BaseSchema):
    name: str
    code: str
    category: str = "other"
    country_code: Optional[str] = None
    description: Optional[str] = None
    is_mandatory: bool = False
    is_expirable: bool = False
    expiry_reminder_days: int = 30
    allowed_mime_types: Optional[str] = None
    max_file_size_mb: int = 10
    access_level: str = "private"
    sort_order: int = 100


class DocumentTypeTemplateUpdate(BaseSchema):
    name: Optional[str] = None
    description: Optional[str] = None
    is_mandatory: Optional[bool] = None
    is_expirable: Optional[bool] = None
    expiry_reminder_days: Optional[int] = None
    access_level: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class DocumentTypeTemplateResponse(BaseResponse):
    company_id: Optional[str] = None
    name: str
    code: str
    category: str
    country_code: Optional[str] = None
    description: Optional[str] = None
    is_mandatory: bool
    is_expirable: bool
    expiry_reminder_days: int
    allowed_mime_types: Optional[str] = None
    max_file_size_mb: int
    access_level: str
    sort_order: int


# ──────────────────────────────────────────────────────────────────────────────
# Employee Documents
# ──────────────────────────────────────────────────────────────────────────────

class EmployeeDocumentResponse(BaseResponse):
    company_id: str
    employee_id: str
    template_id: Optional[str] = None
    document_code: Optional[str] = None
    document_name: str
    category: str
    status: str
    access_level: str
    file_name: str
    file_url: str
    mime_type: Optional[str] = None
    file_size: Optional[int] = None
    version: int
    uploaded_by_id: Optional[str] = None
    reviewed_by_id: Optional[str] = None
    notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    expiry_date: Optional[date] = None
    is_confidential: bool
    # Joined template info
    template_name: Optional[str] = None
    template_category: Optional[str] = None

    @model_validator(mode="after")
    def populate_template_fields(self) -> "EmployeeDocumentResponse":
        return self


class EmployeeDocumentUpdate(BaseSchema):
    document_name: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    expiry_date: Optional[date] = None
    access_level: Optional[str] = None


class DocumentReviewAction(BaseSchema):
    action: str  # "approve" | "reject" | "request_resubmission"
    notes: Optional[str] = None
    rejection_reason: Optional[str] = None


# ──────────────────────────────────────────────────────────────────────────────
# Onboarding Checklist
# ──────────────────────────────────────────────────────────────────────────────

class OnboardingChecklistItemResponse(BaseResponse):
    checklist_id: str
    task_key: str
    task_label: str
    is_required: bool
    status: str
    completed_by_id: Optional[str] = None
    completed_at: Optional[date] = None
    notes: Optional[str] = None
    sort_order: int


class OnboardingChecklistResponse(BaseResponse):
    company_id: str
    employee_id: str
    status: str
    completion_pct: int
    assigned_hr_id: Optional[str] = None
    notes: Optional[str] = None
    items: List[OnboardingChecklistItemResponse] = []


class OnboardingItemUpdate(BaseSchema):
    status: str
    notes: Optional[str] = None


# ──────────────────────────────────────────────────────────────────────────────
# Exit Checklist
# ──────────────────────────────────────────────────────────────────────────────

class ExitChecklistItemResponse(BaseResponse):
    checklist_id: str
    task_key: str
    task_label: str
    is_required: bool
    status: str
    completed_by_id: Optional[str] = None
    completed_at: Optional[date] = None
    notes: Optional[str] = None
    sort_order: int


class ExitChecklistResponse(BaseResponse):
    company_id: str
    employee_id: str
    status: str
    last_working_day: Optional[date] = None
    resignation_date: Optional[date] = None
    manager_approved: bool
    hr_clearance: bool
    payroll_cleared: bool
    assets_returned: bool
    completion_pct: int
    assigned_hr_id: Optional[str] = None
    notes: Optional[str] = None
    items: List[ExitChecklistItemResponse] = []


class ExitChecklistCreate(BaseSchema):
    employee_id: str
    last_working_day: Optional[date] = None
    resignation_date: Optional[date] = None
    notes: Optional[str] = None


class ExitChecklistUpdate(BaseSchema):
    status: Optional[str] = None
    last_working_day: Optional[date] = None
    manager_approved: Optional[bool] = None
    hr_clearance: Optional[bool] = None
    payroll_cleared: Optional[bool] = None
    assets_returned: Optional[bool] = None
    notes: Optional[str] = None


# ──────────────────────────────────────────────────────────────────────────────
# Bank Account
# ──────────────────────────────────────────────────────────────────────────────

class BankAccountCreate(BaseSchema):
    employee_id: str
    bank_name: str
    account_holder_name: str
    account_number: str
    account_type: str = "savings"
    ifsc_code: Optional[str] = None
    branch_name: Optional[str] = None
    swift_code: Optional[str] = None
    routing_number: Optional[str] = None
    iban: Optional[str] = None
    currency: str = "INR"
    country_code: str = "IN"
    is_primary: bool = True
    upi_id: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("account_number")
    @classmethod
    def validate_account_number(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 4:
            raise ValueError("Account number must be at least 4 characters")
        return v


class BankAccountUpdate(BaseSchema):
    bank_name: Optional[str] = None
    account_holder_name: Optional[str] = None
    account_type: Optional[str] = None
    ifsc_code: Optional[str] = None
    branch_name: Optional[str] = None
    swift_code: Optional[str] = None
    upi_id: Optional[str] = None
    is_primary: Optional[bool] = None
    notes: Optional[str] = None


class BankAccountResponse(BaseResponse):
    company_id: str
    employee_id: str
    bank_name: str
    account_holder_name: str
    # Masked for security — never return full account number in list
    account_number_masked: str
    account_type: str
    ifsc_code: Optional[str] = None
    branch_name: Optional[str] = None
    swift_code: Optional[str] = None
    routing_number: Optional[str] = None
    iban: Optional[str] = None
    currency: str
    country_code: str
    is_primary: bool
    is_verified: bool
    verified_by_id: Optional[str] = None
    upi_id: Optional[str] = None
    notes: Optional[str] = None


# ──────────────────────────────────────────────────────────────────────────────
# Document Access Log
# ──────────────────────────────────────────────────────────────────────────────

class DocumentAccessLogResponse(BaseResponse):
    company_id: str
    document_id: str
    actor_user_id: Optional[str] = None
    action: str
    ip_address: Optional[str] = None
    detail: Optional[str] = None
    created_at: Optional[datetime] = None


# ──────────────────────────────────────────────────────────────────────────────
# Summary / Dashboard schemas
# ──────────────────────────────────────────────────────────────────────────────

class DocumentVaultSummary(BaseSchema):
    """Per-employee document readiness summary."""
    employee_id: str
    employee_name: str
    employee_code: Optional[str] = None
    total_required: int
    uploaded: int
    approved: int
    missing: int
    pending_review: int
    expired: int
    onboarding_status: Optional[str] = None
    onboarding_pct: int = 0
