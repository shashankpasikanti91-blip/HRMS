"""Organization-level configuration: branches, designations, org settings."""
from __future__ import annotations

from typing import Any, Optional

from sqlalchemy import String, ForeignKey, Integer, Text, Boolean, JSON, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class Branch(BaseModel):
    """Office locations / branches within an organization."""
    __tablename__ = "branches"

    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)
    branch_type: Mapped[str] = mapped_column(String(30), default="branch", nullable=False)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    timezone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    manager_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True
    )
    employee_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    __table_args__ = (
        __import__("sqlalchemy").UniqueConstraint("company_id", "code", name="uq_branch_code_company"),
    )


class Designation(BaseModel):
    """Job titles / designations per organization."""
    __tablename__ = "designations"

    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)
    level: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # seniority level
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    __table_args__ = (
        __import__("sqlalchemy").UniqueConstraint("company_id", "name", name="uq_designation_name_company"),
    )


class OrganizationSettings(BaseModel):
    """Per-organization configuration: payroll, leave, attendance, working week."""
    __tablename__ = "organization_settings"

    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )
    # Working week (JSON array of day numbers 0=Mon..6=Sun that are working days)
    working_days: Mapped[Optional[list]] = mapped_column(JSON, nullable=True, default=lambda: [0, 1, 2, 3, 4])
    weekend_days: Mapped[Optional[list]] = mapped_column(JSON, nullable=True, default=lambda: [5, 6])

    # Working hours
    work_start_time: Mapped[Optional[str]] = mapped_column(String(10), default="09:00", nullable=True)
    work_end_time: Mapped[Optional[str]] = mapped_column(String(10), default="18:00", nullable=True)
    daily_work_hours: Mapped[float] = mapped_column(Float, default=8.0, nullable=False)
    weekly_work_hours: Mapped[float] = mapped_column(Float, default=40.0, nullable=False)

    # Late / overtime
    late_threshold_minutes: Mapped[int] = mapped_column(Integer, default=15, nullable=False)
    overtime_threshold_hours: Mapped[float] = mapped_column(Float, default=8.0, nullable=False)
    overtime_multiplier: Mapped[float] = mapped_column(Float, default=1.5, nullable=False)

    # Payroll
    payroll_cycle: Mapped[str] = mapped_column(String(30), default="monthly", nullable=False)
    payroll_process_day: Mapped[int] = mapped_column(Integer, default=28, nullable=False)  # day of month
    default_currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)

    # Probation
    probation_period_days: Mapped[int] = mapped_column(Integer, default=90, nullable=False)
    notice_period_days: Mapped[int] = mapped_column(Integer, default=30, nullable=False)

    # Date / time formats
    date_format: Mapped[str] = mapped_column(String(20), default="DD/MM/YYYY", nullable=False)
    time_format: Mapped[str] = mapped_column(String(10), default="24h", nullable=False)

    # Password policy
    password_min_length: Mapped[int] = mapped_column(Integer, default=8, nullable=False)
    password_require_uppercase: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    password_require_number: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    password_require_special: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    password_expiry_days: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # 0 = never

    # Features toggles
    enable_overtime: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    enable_shifts: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    enable_geo_tracking: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    enable_client_billing: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    enable_telegram_bot: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Additional JSON config
    custom_config: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON, nullable=True)
