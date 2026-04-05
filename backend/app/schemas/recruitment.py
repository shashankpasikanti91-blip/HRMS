from __future__ import annotations

from datetime import date, datetime
from typing import Any, List, Optional

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
    source: Optional[CandidateSource] = None
    source_details: Optional[str] = None
    tags: Optional[list[str]] = None


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
