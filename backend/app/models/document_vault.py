"""Employee Document Vault — secure, multi-country onboarding & HR document management."""
from __future__ import annotations

from typing import Optional

from sqlalchemy import String, ForeignKey, Integer, Boolean, Text, Date, BigInteger
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.utils.enums import (
    DocVaultCategory, DocVaultStatus, OnboardingStatus,
    ExitStatus, DocAccessLevel, BankAccountType,
)


class DocumentTypeTemplate(BaseModel):
    """Master template for a required document type (configurable per company/country)."""
    __tablename__ = "document_type_templates"

    company_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=True, index=True
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    code: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    category: Mapped[str] = mapped_column(
        String(50), default=DocVaultCategory.OTHER.value, nullable=False, index=True
    )
    country_code: Mapped[Optional[str]] = mapped_column(String(10), nullable=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_mandatory: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_expirable: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    expiry_reminder_days: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    allowed_mime_types: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # comma-sep
    max_file_size_mb: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    access_level: Mapped[str] = mapped_column(
        String(30), default=DocAccessLevel.PRIVATE.value, nullable=False
    )
    sort_order: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    # back-relationship
    employee_documents: Mapped[list["EmployeeDocument"]] = relationship(
        "EmployeeDocument", back_populates="template", lazy="select"
    )


class EmployeeDocument(BaseModel):
    """A document belonging to a specific employee — with full lifecycle tracking."""
    __tablename__ = "employee_documents"

    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    employee_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True
    )
    template_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("document_type_templates.id", ondelete="SET NULL"), nullable=True, index=True
    )
    document_code: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    document_name: Mapped[str] = mapped_column(String(300), nullable=False)
    category: Mapped[str] = mapped_column(
        String(50), default=DocVaultCategory.OTHER.value, nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(
        String(40), default=DocVaultStatus.UPLOADED.value, nullable=False, index=True
    )
    access_level: Mapped[str] = mapped_column(
        String(30), default=DocAccessLevel.PRIVATE.value, nullable=False
    )
    # File storage
    file_name: Mapped[str] = mapped_column(String(500), nullable=False)
    file_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    mime_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    file_size: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    file_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)  # SHA-256
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    # Metadata
    uploaded_by_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    reviewed_by_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    expiry_date: Mapped[Optional[Date]] = mapped_column(Date, nullable=True, index=True)
    is_confidential: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    # Relationships
    template: Mapped[Optional["DocumentTypeTemplate"]] = relationship(
        "DocumentTypeTemplate", back_populates="employee_documents", lazy="joined"
    )
    access_logs: Mapped[list["DocumentAccessLog"]] = relationship(
        "DocumentAccessLog", back_populates="document", lazy="select",
        foreign_keys="[DocumentAccessLog.document_id]"
    )


class DocumentAccessLog(BaseModel):
    """Immutable audit log — every view/download/delete action on employee docs."""
    __tablename__ = "document_access_logs"

    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    document_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("employee_documents.id", ondelete="CASCADE"), nullable=False, index=True
    )
    actor_user_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    action: Mapped[str] = mapped_column(String(30), nullable=False, index=True)  # view|download|delete|upload|approve|reject
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    detail: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Relationship
    document: Mapped[Optional["EmployeeDocument"]] = relationship(
        "EmployeeDocument", back_populates="access_logs",
        foreign_keys=[document_id]
    )


class OnboardingChecklist(BaseModel):
    """One checklist instance per employee onboarding."""
    __tablename__ = "onboarding_checklists"

    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    employee_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True, unique=True
    )
    status: Mapped[str] = mapped_column(
        String(40), default=OnboardingStatus.NOT_STARTED.value, nullable=False, index=True
    )
    completion_pct: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    assigned_hr_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    items: Mapped[list["OnboardingChecklistItem"]] = relationship(
        "OnboardingChecklistItem", back_populates="checklist",
        cascade="all, delete-orphan", order_by="OnboardingChecklistItem.sort_order"
    )


class OnboardingChecklistItem(BaseModel):
    """Individual task inside an onboarding checklist."""
    __tablename__ = "onboarding_checklist_items"

    checklist_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("onboarding_checklists.id", ondelete="CASCADE"), nullable=False, index=True
    )
    task_key: Mapped[str] = mapped_column(String(100), nullable=False)
    task_label: Mapped[str] = mapped_column(String(300), nullable=False)
    is_required: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    status: Mapped[str] = mapped_column(
        String(40), default=OnboardingStatus.NOT_STARTED.value, nullable=False
    )
    completed_by_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    completed_at: Mapped[Optional[Date]] = mapped_column(Date, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    checklist: Mapped["OnboardingChecklist"] = relationship(
        "OnboardingChecklist", back_populates="items"
    )


class ExitChecklist(BaseModel):
    """Exit/resignation workflow per employee."""
    __tablename__ = "exit_checklists"

    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    employee_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(
        String(40), default=ExitStatus.INITIATED.value, nullable=False, index=True
    )
    last_working_day: Mapped[Optional[Date]] = mapped_column(Date, nullable=True)
    resignation_date: Mapped[Optional[Date]] = mapped_column(Date, nullable=True)
    manager_approved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    hr_clearance: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    payroll_cleared: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    assets_returned: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    completion_pct: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    assigned_hr_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    items: Mapped[list["ExitChecklistItem"]] = relationship(
        "ExitChecklistItem", back_populates="checklist",
        cascade="all, delete-orphan", order_by="ExitChecklistItem.sort_order"
    )


class ExitChecklistItem(BaseModel):
    """Individual task inside an exit checklist."""
    __tablename__ = "exit_checklist_items"

    checklist_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("exit_checklists.id", ondelete="CASCADE"), nullable=False, index=True
    )
    task_key: Mapped[str] = mapped_column(String(100), nullable=False)
    task_label: Mapped[str] = mapped_column(String(300), nullable=False)
    is_required: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    status: Mapped[str] = mapped_column(String(40), default="not_started", nullable=False)
    completed_by_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    completed_at: Mapped[Optional[Date]] = mapped_column(Date, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    checklist: Mapped["ExitChecklist"] = relationship("ExitChecklist", back_populates="items")


class EmployeeBankAccount(BaseModel):
    """Secure payroll banking profile for an employee."""
    __tablename__ = "employee_bank_accounts"

    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    employee_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True
    )
    bank_name: Mapped[str] = mapped_column(String(200), nullable=False)
    account_holder_name: Mapped[str] = mapped_column(String(200), nullable=False)
    account_number: Mapped[str] = mapped_column(String(50), nullable=False)
    account_type: Mapped[str] = mapped_column(
        String(30), default=BankAccountType.SAVINGS.value, nullable=False
    )
    ifsc_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    branch_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    swift_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    routing_number: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)  # ACH/US
    iban: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # EU/SEPA
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    country_code: Mapped[str] = mapped_column(String(10), default="IN", nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    verified_by_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    upi_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
