from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import String, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.utils.enums import UserRole, UserStatus


class User(BaseModel):
    __tablename__ = "users"

    company_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=True, index=True
    )
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    first_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    last_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    password_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    role: Mapped[str] = mapped_column(
        String(30), default=UserRole.EMPLOYEE.value, nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(
        String(30), default=UserStatus.INVITED.value, nullable=False, index=True
    )
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)

    # ── Unique per company ─────────────────────────────────────────────────
    __table_args__ = (
        __import__("sqlalchemy").UniqueConstraint("email", "company_id", name="uq_users_email_company"),
    )

    # ── Relationships ──────────────────────────────────────────────────────
    company: Mapped[Optional["Company"]] = relationship("Company", back_populates="users", lazy="noload")  # type: ignore[name-defined]
    employee: Mapped[Optional["Employee"]] = relationship("Employee", back_populates="user", lazy="noload", uselist=False)  # type: ignore[name-defined]


class TokenBlacklist(BaseModel):
    """Stores revoked tokens (logout / password reset)."""
    __tablename__ = "token_blacklist"

    jti: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
