from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import String, ForeignKey, DateTime, Float, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel
from app.utils.enums import PayrollStatus, PaymentStatus


class PayrollRun(BaseModel):
    __tablename__ = "payroll_runs"

    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    period_month: Mapped[int] = mapped_column(Integer, nullable=False)
    period_year: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(
        String(30), default=PayrollStatus.DRAFT.value, nullable=False, index=True
    )
    processed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    total_employees: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_gross: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    total_deductions: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    total_net: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)

    __table_args__ = (
        __import__("sqlalchemy").UniqueConstraint(
            "company_id", "period_month", "period_year", name="uq_payroll_run_period"
        ),
    )


class PayrollItem(BaseModel):
    __tablename__ = "payroll_items"

    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    payroll_run_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("payroll_runs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    employee_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True
    )
    gross_salary: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    allowances: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    deductions: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    tax_amount: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    net_salary: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    payment_status: Mapped[str] = mapped_column(
        String(30), default=PaymentStatus.PENDING.value, nullable=False
    )
    payment_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    payslip_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
