from __future__ import annotations

from typing import Any, Optional

from sqlalchemy import String, Integer, Text, Boolean
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.utils.enums import CompanyStatus, SubscriptionPlan, SubscriptionStatus


class Company(BaseModel):
    __tablename__ = "companies"

    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    legal_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, default="India")
    timezone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, default="Asia/Kolkata")
    logo_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    employee_limit: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    status: Mapped[str] = mapped_column(
        String(30), default=CompanyStatus.TRIAL.value, nullable=False, index=True
    )
    branding_settings: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    subscription_plan: Mapped[str] = mapped_column(
        String(30), default=SubscriptionPlan.FREE.value, nullable=False
    )
    subscription_status: Mapped[str] = mapped_column(
        String(30), default=SubscriptionStatus.TRIAL.value, nullable=False
    )

    # ── Relationships ──────────────────────────────────────────────────────
    users: Mapped[list["User"]] = relationship("User", back_populates="company", lazy="noload")  # type: ignore[name-defined]
    employees: Mapped[list["Employee"]] = relationship("Employee", back_populates="company", lazy="noload")  # type: ignore[name-defined]
    departments: Mapped[list["Department"]] = relationship("Department", back_populates="company", lazy="noload")  # type: ignore[name-defined]
