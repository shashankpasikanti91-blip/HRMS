"""Telegram bot integration models."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import String, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class TelegramLink(BaseModel):
    """Links employee accounts to Telegram for bot access."""
    __tablename__ = "telegram_links"

    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    employee_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True, index=True
    )
    telegram_chat_id: Mapped[str] = mapped_column(String(50), nullable=False, unique=True, index=True)
    telegram_username: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    otp_code: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    otp_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    linked_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class TelegramCommandLog(BaseModel):
    """Audit log for Telegram bot commands."""
    __tablename__ = "telegram_command_logs"

    company_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="SET NULL"), nullable=True, index=True
    )
    user_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    telegram_chat_id: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    command: Mapped[str] = mapped_column(String(255), nullable=False)
    command_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    response_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    success: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
