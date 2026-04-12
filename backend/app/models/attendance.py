from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from sqlalchemy import String, ForeignKey, Date, DateTime, Float, Integer, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.utils.enums import AttendanceStatus, CheckInMethod


class Attendance(BaseModel):
    __tablename__ = "attendance"

    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    employee_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True
    )
    attendance_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    shift_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    check_in_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    check_out_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    total_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    overtime_hours: Mapped[Optional[float]] = mapped_column(Float, default=0.0, nullable=True)
    late_minutes: Mapped[Optional[int]] = mapped_column(Integer, default=0, nullable=True)
    status: Mapped[str] = mapped_column(
        String(30), default=AttendanceStatus.PRESENT.value, nullable=False, index=True
    )
    check_in_method: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    check_out_method: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    check_in_location: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    check_out_location: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    approved_by: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    is_approved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    __table_args__ = (
        __import__("sqlalchemy").UniqueConstraint(
            "employee_id", "attendance_date", name="uq_attendance_employee_date"
        ),
    )

    # ── Relationships ──────────────────────────────────────────────────────
    employee: Mapped["Employee"] = relationship("Employee", back_populates="attendance_records", lazy="noload")  # type: ignore[name-defined]


class LeaveRequest(BaseModel):
    __tablename__ = "leave_requests"

    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    employee_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True
    )
    leave_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    total_days: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="pending", nullable=False, index=True)
    approved_by: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # ── Relationships ──────────────────────────────────────────────────────
    employee: Mapped["Employee"] = relationship("Employee", back_populates="leave_requests", foreign_keys=[employee_id], lazy="noload")  # type: ignore[name-defined]


class Holiday(BaseModel):
    __tablename__ = "holidays"

    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    holiday_type: Mapped[str] = mapped_column(
        String(50), default="public", nullable=False
    )  # public, restricted, optional
    country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_paid: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    __table_args__ = (
        __import__("sqlalchemy").UniqueConstraint(
            "company_id", "date", "name", name="uq_holiday_company_date_name"
        ),
    )
