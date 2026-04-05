from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_hr_or_above, require_recruiter_or_above
from app.core.pagination import PaginationParams, Page
from app.models.user import User
from app.schemas.recruitment import (
    JobPostingCreate,
    JobPostingUpdate,
    JobPostingResponse,
    CandidateCreate,
    CandidateUpdate,
    CandidateResponse,
    ApplicationCreate,
    ApplicationStageUpdate,
    ApplicationResponse,
    InterviewCreate,
    InterviewUpdate,
    InterviewResponse,
    OfferCreate,
    OfferUpdate,
    OfferResponse,
    OfferStatusUpdate,
)
from app.services.recruitment_service import RecruitmentService, InterviewService, OfferService

job_router = APIRouter(prefix="/jobs", tags=["Job Postings"])
candidate_router = APIRouter(prefix="/candidates", tags=["Candidates"])
application_router = APIRouter(prefix="/applications", tags=["Applications"])
interview_router = APIRouter(prefix="/interviews", tags=["Interviews"])
offer_router = APIRouter(prefix="/offers", tags=["Offers"])


# ── Job Postings ───────────────────────────────────────────────────────────

@job_router.post("", response_model=JobPostingResponse, status_code=201)
async def create_job(
    data: JobPostingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter_or_above()),
):
    svc = RecruitmentService(db)
    job = await svc.create_job(data, current_user.company_id, current_user.id)
    return JobPostingResponse.model_validate(job)


@job_router.get("", response_model=Page[JobPostingResponse])
async def list_jobs(
    params: PaginationParams = Depends(),
    status: Optional[str] = Query(None),
    department_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = RecruitmentService(db)
    jobs, total = await svc.list_jobs(
        current_user.company_id, params, status=status, department_id=department_id
    )
    return Page.create([JobPostingResponse.model_validate(j) for j in jobs], total, params)


@job_router.get("/{business_id}", response_model=JobPostingResponse)
async def get_job(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = RecruitmentService(db)
    job = await svc.get_job(business_id, current_user.company_id)
    return JobPostingResponse.model_validate(job)


@job_router.put("/{business_id}", response_model=JobPostingResponse)
async def update_job(
    business_id: str,
    data: JobPostingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter_or_above()),
):
    svc = RecruitmentService(db)
    job = await svc.update_job(business_id, data, current_user.company_id, current_user.id)
    return JobPostingResponse.model_validate(job)


@job_router.delete("/{business_id}", status_code=204)
async def delete_job(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    svc = RecruitmentService(db)
    await svc.delete_job(business_id, current_user.company_id)


# ── Candidates ─────────────────────────────────────────────────────────────

@candidate_router.post("", response_model=CandidateResponse, status_code=201)
async def create_candidate(
    data: CandidateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter_or_above()),
):
    svc = RecruitmentService(db)
    candidate = await svc.create_candidate(data, current_user.company_id, current_user.id)
    return CandidateResponse.model_validate(candidate)


@candidate_router.get("", response_model=Page[CandidateResponse])
async def list_candidates(
    params: PaginationParams = Depends(),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = RecruitmentService(db)
    candidates, total = await svc.list_candidates(current_user.company_id, params, search=search)
    return Page.create([CandidateResponse.model_validate(c) for c in candidates], total, params)


@candidate_router.get("/{business_id}", response_model=CandidateResponse)
async def get_candidate(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = RecruitmentService(db)
    candidate = await svc.get_candidate(business_id, current_user.company_id)
    return CandidateResponse.model_validate(candidate)


@candidate_router.put("/{business_id}", response_model=CandidateResponse)
async def update_candidate(
    business_id: str,
    data: CandidateUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter_or_above()),
):
    svc = RecruitmentService(db)
    candidate = await svc.update_candidate(business_id, data, current_user.company_id, current_user.id)
    return CandidateResponse.model_validate(candidate)


# ── Applications ───────────────────────────────────────────────────────────

@application_router.post("", response_model=ApplicationResponse, status_code=201)
async def create_application(
    data: ApplicationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter_or_above()),
):
    svc = RecruitmentService(db)
    app_obj = await svc.create_application(data, current_user.company_id, current_user.id)
    return ApplicationResponse.model_validate(app_obj)


@application_router.get("", response_model=Page[ApplicationResponse])
async def list_applications(
    params: PaginationParams = Depends(),
    job_id: Optional[str] = Query(None),
    candidate_id: Optional[str] = Query(None),
    stage: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = RecruitmentService(db)
    apps, total = await svc.list_applications(
        current_user.company_id, params, job_id=job_id, candidate_id=candidate_id, stage=stage
    )
    return Page.create([ApplicationResponse.model_validate(a) for a in apps], total, params)


@application_router.get("/{business_id}", response_model=ApplicationResponse)
async def get_application(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = RecruitmentService(db)
    app_obj = await svc.get_application(business_id, current_user.company_id)
    return ApplicationResponse.model_validate(app_obj)


@application_router.put("/{business_id}/stage", response_model=ApplicationResponse)
async def update_application_stage(
    business_id: str,
    data: ApplicationStageUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter_or_above()),
):
    """Move application to a new recruitment stage."""
    svc = RecruitmentService(db)
    app_obj = await svc.update_stage(business_id, data, current_user.company_id, current_user.id)
    return ApplicationResponse.model_validate(app_obj)


# ── Interviews ─────────────────────────────────────────────────────────────

@interview_router.post("", response_model=InterviewResponse, status_code=201)
async def create_interview(
    data: InterviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter_or_above()),
):
    svc = InterviewService(db)
    interview = await svc.create(data, current_user.company_id, current_user.id)
    return InterviewResponse.model_validate(interview)


@interview_router.get("", response_model=Page[InterviewResponse])
async def list_interviews(
    params: PaginationParams = Depends(),
    application_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = InterviewService(db)
    interviews, total = await svc.list(
        current_user.company_id, params, application_id=application_id, status=status
    )
    return Page.create([InterviewResponse.model_validate(i) for i in interviews], total, params)


@interview_router.get("/{business_id}", response_model=InterviewResponse)
async def get_interview(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = InterviewService(db)
    interview = await svc.get(business_id, current_user.company_id)
    return InterviewResponse.model_validate(interview)


@interview_router.put("/{business_id}", response_model=InterviewResponse)
async def update_interview(
    business_id: str,
    data: InterviewUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter_or_above()),
):
    svc = InterviewService(db)
    interview = await svc.update(business_id, data, current_user.company_id, current_user.id)
    return InterviewResponse.model_validate(interview)


@interview_router.delete("/{business_id}", status_code=204)
async def delete_interview(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter_or_above()),
):
    svc = InterviewService(db)
    await svc.delete(business_id, current_user.company_id)


# ── Offers ─────────────────────────────────────────────────────────────────

@offer_router.post("", response_model=OfferResponse, status_code=201)
async def create_offer(
    data: OfferCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    svc = OfferService(db)
    offer = await svc.create(data, current_user.company_id, current_user.id)
    return OfferResponse.model_validate(offer)


@offer_router.get("", response_model=Page[OfferResponse])
async def list_offers(
    params: PaginationParams = Depends(),
    application_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = OfferService(db)
    offers, total = await svc.list(
        current_user.company_id, params, application_id=application_id, status=status
    )
    return Page.create([OfferResponse.model_validate(o) for o in offers], total, params)


@offer_router.get("/{business_id}", response_model=OfferResponse)
async def get_offer(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = OfferService(db)
    offer = await svc.get(business_id, current_user.company_id)
    return OfferResponse.model_validate(offer)


@offer_router.put("/{business_id}", response_model=OfferResponse)
async def update_offer(
    business_id: str,
    data: OfferUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    svc = OfferService(db)
    offer = await svc.update(business_id, data, current_user.company_id, current_user.id)
    return OfferResponse.model_validate(offer)


@offer_router.put("/{business_id}/status", response_model=OfferResponse)
async def update_offer_status(
    business_id: str,
    data: OfferStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Candidate accepts or declines an offer."""
    svc = OfferService(db)
    offer = await svc.update_status(business_id, data, current_user.company_id, current_user.id)
    return OfferResponse.model_validate(offer)
