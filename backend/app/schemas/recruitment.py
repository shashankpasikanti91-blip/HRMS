from __future__ import annotations

import re
from datetime import date, datetime
from typing import Any, List, Optional

from pydantic import EmailStr, field_validator, model_validator

from app.schemas.base import BaseSchema, BaseResponse
from app.utils.enums import (
    JobStatus,
    ExperienceLevel,
    EmploymentType,
    CandidateSource,
    ApplicationStatus,
    ApplicationStage,
    AIScreeningStatus,
    InterviewType,
    InterviewStatus,
    OfferStatus,
)


# ── Job Postings ───────────────────────────────────────────────────────────

class JobPostingCreate(BaseSchema):
    title: str
    department_id: Optional[str] = None
    hiring_manager_id: Optional[str] = None
    recruiter_id: Optional[str] = None
    employment_type: Optional[EmploymentType] = None
    experience_level: Optional[ExperienceLevel] = None
    location: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    currency: str = "INR"
    openings: int = 1
    description: Optional[str] = None
    requirements: Optional[str] = None
    closing_date: Optional[date] = None


class JobPostingUpdate(BaseSchema):
    title: Optional[str] = None
    department_id: Optional[str] = None
    hiring_manager_id: Optional[str] = None
    recruiter_id: Optional[str] = None
    employment_type: Optional[EmploymentType] = None
    experience_level: Optional[ExperienceLevel] = None
    location: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    openings: Optional[int] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    closing_date: Optional[date] = None


class JobPostingStatusUpdate(BaseSchema):
    status: JobStatus


class JobPostingResponse(BaseResponse):
    company_id: str
    title: str
    department_id: Optional[str] = None
    department_name: Optional[str] = None
    hiring_manager_id: Optional[str] = None
    recruiter_id: Optional[str] = None
    employment_type: Optional[str] = None
    experience_level: Optional[str] = None
    location: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    currency: str = "INR"
    openings: int = 1
    description: Optional[str] = None
    requirements: Optional[str] = None
    status: str
    posted_at: Optional[datetime] = None
    closing_date: Optional[date] = None
    applications_count: Optional[int] = None


# ── Candidates ─────────────────────────────────────────────────────────────

class CandidateCreate(BaseSchema):
    full_name: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: EmailStr
    phone: Optional[str] = None
    current_location: Optional[str] = None
    years_of_experience: Optional[float] = None
    current_company: Optional[str] = None
    current_role: Optional[str] = None
    expected_salary: Optional[float] = None
    notice_period: Optional[int] = None
    resume_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    source: Optional[CandidateSource] = None
    source_details: Optional[str] = None
    tags: Optional[list[str]] = None

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Full name must be at least 2 characters")
        if len(v) > 200:
            raise ValueError("Full name must be at most 200 characters")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        cleaned = re.sub(r"[\s\-\(\)]", "", v)
        if not re.match(r"^\+?\d{7,15}$", cleaned):
            raise ValueError("Invalid phone number format")
        return v.strip()

    @field_validator("linkedin_url")
    @classmethod
    def validate_linkedin(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if v and not re.match(r"^https?://(www\.)?linkedin\.com/", v, re.IGNORECASE):
            raise ValueError("Invalid LinkedIn URL")
        return v

    @model_validator(mode="after")
    def auto_split_name(self):
        if not self.first_name and self.full_name:
            parts = self.full_name.strip().split(" ", 1)
            self.first_name = parts[0]
            self.last_name = parts[1] if len(parts) > 1 else None
        return self


class CandidateUpdate(BaseSchema):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    current_location: Optional[str] = None
    years_of_experience: Optional[float] = None
    current_company: Optional[str] = None
    current_role: Optional[str] = None
    expected_salary: Optional[float] = None
    notice_period: Optional[int] = None
    resume_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    source: Optional[CandidateSource] = None
    source_details: Optional[str] = None
    tags: Optional[list[str]] = None


class CandidateResponse(BaseResponse):
    company_id: str
    full_name: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: str
    phone: Optional[str] = None
    current_location: Optional[str] = None
    years_of_experience: Optional[float] = None
    current_company: Optional[str] = None
    current_role: Optional[str] = None
    expected_salary: Optional[float] = None
    notice_period: Optional[int] = None
    resume_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    source: Optional[str] = None
    ai_summary: Optional[str] = None
    ai_score: Optional[float] = None
    tags: Optional[Any] = None
    applications_count: Optional[int] = None


# ── Applications ───────────────────────────────────────────────────────────

class ApplicationCreate(BaseSchema):
    candidate_id: str
    job_posting_id: str
    source: Optional[str] = None
    recruiter_notes: Optional[str] = None


class ApplicationStageUpdate(BaseSchema):
    current_stage: ApplicationStage
    recruiter_notes: Optional[str] = None


class ApplicationStatusUpdate(BaseSchema):
    application_status: ApplicationStatus


class ApplicationResponse(BaseResponse):
    company_id: str
    candidate_id: str
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    job_posting_id: str
    job_title: Optional[str] = None
    current_stage: str
    application_status: str
    applied_at: Optional[datetime] = None
    source: Optional[str] = None
    recruiter_notes: Optional[str] = None
    ai_screening_status: str
    ai_screening_score: Optional[float] = None
    ai_recommendation: Optional[str] = None
    shortlisted_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None
    hired_at: Optional[datetime] = None


# ── Interviews ─────────────────────────────────────────────────────────────

class InterviewCreate(BaseSchema):
    application_id: str
    candidate_id: str
    job_posting_id: str
    interview_type: Optional[InterviewType] = InterviewType.VIDEO
    round_name: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = 60
    meeting_link: Optional[str] = None
    interviewer_id: Optional[str] = None


class InterviewUpdate(BaseSchema):
    interview_type: Optional[InterviewType] = None
    round_name: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    meeting_link: Optional[str] = None
    interviewer_id: Optional[str] = None
    interview_status: Optional[InterviewStatus] = None
    feedback: Optional[str] = None
    score: Optional[float] = None
    recommendation: Optional[str] = None


class InterviewResponse(BaseResponse):
    company_id: str
    application_id: str
    candidate_id: str
    candidate_name: Optional[str] = None
    job_posting_id: str
    job_title: Optional[str] = None
    interview_type: Optional[str] = None
    round_name: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    meeting_link: Optional[str] = None
    interviewer_id: Optional[str] = None
    interview_status: str
    feedback: Optional[str] = None
    score: Optional[float] = None
    recommendation: Optional[str] = None


# ── Offers ─────────────────────────────────────────────────────────────────

class OfferCreate(BaseSchema):
    application_id: str
    candidate_id: str
    offered_role: Optional[str] = None
    offered_salary: Optional[float] = None
    currency: str = "INR"
    joining_date: Optional[date] = None
    notes: Optional[str] = None


class OfferStatusUpdate(BaseSchema):
    offer_status: OfferStatus
    notes: Optional[str] = None


# Alias for full update support
OfferUpdate = OfferStatusUpdate


class OfferResponse(BaseResponse):
    company_id: str
    application_id: str
    candidate_id: str
    candidate_name: Optional[str] = None
    offered_role: Optional[str] = None
    offered_salary: Optional[float] = None
    currency: str
    joining_date: Optional[date] = None
    offer_status: str
    offer_letter_url: Optional[str] = None
    notes: Optional[str] = None
    sent_at: Optional[datetime] = None
    accepted_at: Optional[datetime] = None
    declined_at: Optional[datetime] = None
