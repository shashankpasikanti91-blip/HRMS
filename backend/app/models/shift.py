"""Shift management models."""
from __future__ import annotations

from typing import Optional

from sqlalchemy import String, ForeignKey, Float, Integer, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class Shift(BaseModel):
    """Work shift definitions per organization."""
    __tablename__ = "shifts"

    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)
    shift_type: Mapped[str] = mapped_column(String(30), default="general", nullable=False)
    start_time: Mapped[str] = mapped_column(String(10), nullable=False)  # HH:MM
    end_time: Mapped[str] = mapped_column(String(10), nullable=False)
    break_duration_minutes: Mapped[int] = mapped_column(Integer, default=60, nullable=False)
    work_hours: Mapped[float] = mapped_column(Float, default=8.0, nullable=False)
    is_night_shift: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    grace_minutes: Mapped[int] = mapped_column(Integer, default=15, nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    applicable_days: Mapped[Optional[list]] = mapped_column(
        JSON, nullable=True, default=lambda: [0, 1, 2, 3, 4]
    )

    __table_args__ = (
        __import__("sqlalchemy").UniqueConstraint("company_id", "code", name="uq_shift_code_company"),
    )
