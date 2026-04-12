"""Policy engine: country configs, leave policies, attendance policies with hierarchy."""
from __future__ import annotations

from typing import Any, Optional

from sqlalchemy import String, ForeignKey, Integer, Float, Text, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class CountryConfig(BaseModel):
    """Country-level defaults for rules. Global template when country_code='GLOBAL'."""
    __tablename__ = "country_configs"

    country_code: Mapped[str] = mapped_column(String(10), nullable=False, unique=True, index=True)
    country_name: Mapped[str] = mapped_column(String(255), nullable=False)
    currency_code: Mapped[str] = mapped_column(String(10), default="USD", nullable=False)
    currency_symbol: Mapped[str] = mapped_column(String(10), default="$", nullable=False)
    date_format: Mapped[str] = mapped_column(String(20), default="DD/MM/YYYY", nullable=False)
    timezone: Mapped[str] = mapped_column(String(50), default="UTC", nullable=False)
    default_weekend_days: Mapped[Optional[list]] = mapped_column(JSON, nullable=True, default=lambda: [5, 6])
    default_work_hours: Mapped[float] = mapped_column(Float, default=8.0, nullable=False)
    minimum_wage: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    tax_framework: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON, nullable=True)
    statutory_rules: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON, nullable=True)


class StateConfig(BaseModel):
    """State/province-level overrides on top of country defaults."""
    __tablename__ = "state_configs"

    country_code: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    state_code: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    state_name: Mapped[str] = mapped_column(String(255), nullable=False)
    tax_overrides: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON, nullable=True)
    statutory_overrides: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON, nullable=True)
    minimum_wage_override: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    additional_holidays: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)

    __table_args__ = (
        __import__("sqlalchemy").UniqueConstraint("country_code", "state_code", name="uq_state_country"),
    )


class LeavePolicy(BaseModel):
    """Configurable leave policy per organization."""
    __tablename__ = "leave_policies"

    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    __table_args__ = (
        __import__("sqlalchemy").UniqueConstraint("company_id", "name", name="uq_leave_policy_name"),
    )


class LeaveType(BaseModel):
    """Leave types within a leave policy."""
    __tablename__ = "leave_types"

    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    leave_policy_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("leave_policies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    code: Mapped[str] = mapped_column(String(20), nullable=False)
    annual_quota: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    max_consecutive_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    min_days_per_request: Mapped[float] = mapped_column(Float, default=0.5, nullable=False)
    is_paid: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_carry_forward: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    max_carry_forward: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    accrual_frequency: Mapped[str] = mapped_column(String(30), default="monthly", nullable=False)
    requires_approval: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    requires_attachment: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    min_attachment_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    applicable_gender: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)  # null = all
    probation_eligible: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    encashable: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    color: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # for UI

    __table_args__ = (
        __import__("sqlalchemy").UniqueConstraint("leave_policy_id", "code", name="uq_leave_type_code_policy"),
    )


class LeaveBalance(BaseModel):
    """Per-employee leave balance tracking."""
    __tablename__ = "leave_balances"

    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    employee_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True
    )
    leave_type_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("leave_types.id", ondelete="CASCADE"), nullable=False, index=True
    )
    year: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    allocated: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    used: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    pending: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    carried_forward: Mapped[float] = mapped_column(Float, default=0, nullable=False)

    @property
    def available(self) -> float:
        return self.allocated + self.carried_forward - self.used - self.pending

    __table_args__ = (
        __import__("sqlalchemy").UniqueConstraint(
            "employee_id", "leave_type_id", "year", name="uq_leave_balance_emp_type_year"
        ),
    )


class AttendancePolicy(BaseModel):
    """Attendance rules per organization."""
    __tablename__ = "attendance_policies"

    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    check_in_required: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    auto_checkout: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    auto_checkout_time: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)  # "23:59"
    allow_manual_entry: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    require_approval_for_corrections: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    track_breaks: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    max_break_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    grace_period_minutes: Mapped[int] = mapped_column(Integer, default=15, nullable=False)
    half_day_hours: Mapped[float] = mapped_column(Float, default=4.0, nullable=False)
    min_hours_for_full_day: Mapped[float] = mapped_column(Float, default=7.0, nullable=False)
    enable_geo_fencing: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    geo_fence_radius_meters: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    allowed_check_in_methods: Mapped[Optional[list]] = mapped_column(
        JSON, nullable=True, default=lambda: ["web", "mobile"]
    )
    rules_config: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
