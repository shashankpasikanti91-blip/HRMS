"""Loss of Pay (LOP) models.

Three concepts:
  1. LOPPolicy   – company-level rules for when LOP is applied
  2. LOPRecord   – per-employee per-month LOP calculation result
  3. LOPOverride – HR-approved manual adjustment to a LOPRecord
"""

from __future__ import annotations

import uuid
from datetime import date
from decimal import Decimal
from typing import Optional

from sqlalchemy import (
    Boolean, Date, ForeignKey, Integer, Numeric,
    String, Text, UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel, TimestampMixin, SoftDeleteMixin, AuditMixin
from app.core.database import Base


# ─── LOP Policy ─────────────────────────────────────────────────────────────


class LOPPolicy(BaseModel):
    """Company-level LOP rules."""

    __tablename__ = "lop_policies"
    __table_args__ = (
        UniqueConstraint("company_id", name="uq_lop_policy_company"),
    )

    company_id: Mapped[str] = mapped_column(String(36), ForeignKey("companies.id"), nullable=False, index=True)

    # ── Per-day deduction basis ─────────────────────────────────────────────
    # How many working days per month for per-day salary calculation.
    working_days_per_month: Mapped[int] = mapped_column(Integer, default=26, nullable=False)
    # Whether to use calendar days or actual working days for LOP calculation.
    use_calendar_days: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # ── Triggers ────────────────────────────────────────────────────────────
    # Number of allowed late arrivals per month before LOP is triggered.
    late_grace_count: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    # Each set of N additional lates = 0.5 LOP day
    lates_per_half_day: Mapped[int] = mapped_column(Integer, default=3, nullable=False)

    # ── Unauthorised absence ────────────────────────────────────────────────
    # Absent without approved leave = full LOP day automatically.
    apply_lop_on_absent: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # ── Rounding ────────────────────────────────────────────────────────────
    # Round LOP days to nearest 0.5
    round_to_half_day: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # ── Maximum cap per month ───────────────────────────────────────────────
    max_lop_days_per_month: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # ── Notes ───────────────────────────────────────────────────────────────
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


# ─── LOP Record ──────────────────────────────────────────────────────────────


class LOPRecord(BaseModel):
    """Monthly LOP calculation result for one employee."""

    __tablename__ = "lop_records"
    __table_args__ = (
        UniqueConstraint("company_id", "employee_id", "year", "month", name="uq_lop_record_emp_month"),
    )

    company_id: Mapped[str] = mapped_column(String(36), ForeignKey("companies.id"), nullable=False, index=True)
    employee_id: Mapped[str] = mapped_column(String(36), ForeignKey("employees.id"), nullable=False, index=True)

    year: Mapped[int] = mapped_column(Integer, nullable=False)
    month: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-12

    # ── Raw inputs ──────────────────────────────────────────────────────────
    # Working days in the month (after excluding weekends + holidays)
    total_working_days: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    days_present: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    days_absent: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    days_on_approved_leave: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    late_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # ── Calculated LOP ──────────────────────────────────────────────────────
    lop_from_absence: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("0.00"), nullable=False)
    lop_from_lates: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("0.00"), nullable=False)
    total_lop_days: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("0.00"), nullable=False)

    # ── Override ────────────────────────────────────────────────────────────
    # If HR applied an override, record the override ID here.
    override_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("lop_overrides.id"), nullable=True)
    final_lop_days: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("0.00"), nullable=False)

    # ── Financial impact ────────────────────────────────────────────────────
    per_day_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    total_lop_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    currency: Mapped[str] = mapped_column(String(3), default="MYR", nullable=False)

    # ── Workflow ────────────────────────────────────────────────────────────
    status: Mapped[str] = mapped_column(String(20), default="draft", nullable=False)
    # statuses: draft → reviewed → approved → applied
    approved_by: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    approved_at: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


# ─── LOP Override ────────────────────────────────────────────────────────────


class LOPOverride(Base, TimestampMixin, AuditMixin):
    """HR-approved manual adjustment to LOP days for specific employee-month."""

    __tablename__ = "lop_overrides"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    business_id: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)

    company_id: Mapped[str] = mapped_column(String(36), ForeignKey("companies.id"), nullable=False, index=True)
    employee_id: Mapped[str] = mapped_column(String(36), ForeignKey("employees.id"), nullable=False)

    year: Mapped[int] = mapped_column(Integer, nullable=False)
    month: Mapped[int] = mapped_column(Integer, nullable=False)

    original_lop_days: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    adjusted_lop_days: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    approved_by: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    approved_at: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    # statuses: pending → approved | rejected
