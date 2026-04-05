from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from sqlalchemy import String, ForeignKey, Date, DateTime, Float, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.utils.enums import InterviewType, InterviewStatus, OfferStatus


class Interview(BaseModel):
    __tablename__ = "interviews"

    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    application_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True
    )
    candidate_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True
    )
    job_posting_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("job_postings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    interview_type: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    round_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    scheduled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    meeting_link: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    interviewer_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    interview_status: Mapped[str] = mapped_column(
        String(30), default=InterviewStatus.SCHEDULED.value, nullable=False, index=True
    )
    feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    recommendation: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # ── Relationships ──────────────────────────────────────────────────────
    application: Mapped["Application"] = relationship("Application", back_populates="interviews", lazy="noload")  # type: ignore[name-defined]


class Offer(BaseModel):
    __tablename__ = "offers"

    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    application_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True
    )
    candidate_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True
    )
    offered_role: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    offered_salary: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    joining_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    offer_status: Mapped[str] = mapped_column(
        String(30), default=OfferStatus.DRAFT.value, nullable=False, index=True
    )
    offer_letter_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    accepted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    declined_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # ── Relationships ──────────────────────────────────────────────────────
    application: Mapped["Application"] = relationship("Application", back_populates="offer", lazy="noload")  # type: ignore[name-defined]
