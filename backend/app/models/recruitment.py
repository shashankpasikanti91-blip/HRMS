from __future__ import annotations

from datetime import date, datetime
from typing import Any, Optional

from sqlalchemy import String, ForeignKey, Date, DateTime, Float, Integer, Text, Boolean
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.utils.enums import (
    JobStatus,
    ExperienceLevel,
    CandidateSource,
    ApplicationStatus,
    ApplicationStage,
    AIScreeningStatus,
)


class JobPosting(BaseModel):
    __tablename__ = "job_postings"

    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    department_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True
    )
    hiring_manager_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    recruiter_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    employment_type: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    experience_level: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    salary_min: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    salary_max: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    openings: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    requirements: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(30), default=JobStatus.DRAFT.value, nullable=False, index=True
    )
    posted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    closing_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # ── Relationships ──────────────────────────────────────────────────────
    applications: Mapped[list["Application"]] = relationship(
        "Application", back_populates="job_posting", lazy="noload"
    )


class Candidate(BaseModel):
    __tablename__ = "candidates"

    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    full_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    first_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    last_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    current_location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    years_of_experience: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    current_company: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    current_role: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    expected_salary: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    notice_period: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # days
    resume_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    linkedin_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    portfolio_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    source: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    source_details: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    ai_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ai_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    tags: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)

    # ── Relationships ──────────────────────────────────────────────────────
    applications: Mapped[list["Application"]] = relationship(
        "Application", back_populates="candidate", lazy="noload"
    )

    __table_args__ = (
        __import__("sqlalchemy").UniqueConstraint("email", "company_id", name="uq_candidate_email_company"),
    )


class Application(BaseModel):
    __tablename__ = "applications"

    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    candidate_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True
    )
    job_posting_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("job_postings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    current_stage: Mapped[str] = mapped_column(
        String(50), default=ApplicationStage.APPLIED.value, nullable=False, index=True
    )
    application_status: Mapped[str] = mapped_column(
        String(30), default=ApplicationStatus.ACTIVE.value, nullable=False, index=True
    )
    applied_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    source: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    recruiter_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ai_screening_status: Mapped[str] = mapped_column(
        String(30), default=AIScreeningStatus.PENDING.value, nullable=False
    )
    ai_screening_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ai_matched_skills: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)
    ai_missing_skills: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)
    ai_recommendation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    shortlisted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    rejected_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    hired_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # ── Relationships ──────────────────────────────────────────────────────
    candidate: Mapped["Candidate"] = relationship("Candidate", back_populates="applications", lazy="noload")
    job_posting: Mapped["JobPosting"] = relationship("JobPosting", back_populates="applications", lazy="noload")
    interviews: Mapped[list["Interview"]] = relationship("Interview", back_populates="application", lazy="noload")
    offer: Mapped[Optional["Offer"]] = relationship("Offer", back_populates="application", lazy="noload", uselist=False)
