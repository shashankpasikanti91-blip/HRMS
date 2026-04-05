from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional, Tuple

from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException, ConflictException
from app.core.pagination import PaginationParams
from app.models.recruitment import JobPosting, Candidate, Application
from app.models.interview import Interview, Offer
from app.repositories.base import BaseRepository
from app.schemas.recruitment import (
    JobPostingCreate,
    JobPostingUpdate,
    JobPostingStatusUpdate,
    CandidateCreate,
    CandidateUpdate,
    ApplicationCreate,
    ApplicationStageUpdate,
    ApplicationStatusUpdate,
    InterviewCreate,
    InterviewUpdate,
    OfferCreate,
    OfferStatusUpdate,
)
from app.services.business_id_service import BusinessIdService
from app.utils.enums import JobStatus, ApplicationStage, OfferStatus, AIScreeningStatus
import uuid


class RecruitmentService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.job_repo = BaseRepository(JobPosting, db)
        self.candidate_repo = BaseRepository(Candidate, db)
        self.application_repo = BaseRepository(Application, db)

    # ── Jobs ───────────────────────────────────────────────────────────────
    async def create_job(self, data: JobPostingCreate, company_id: str, created_by: str) -> JobPosting:
        bid = await BusinessIdService.generate(self.db, "job_posting")
        job = JobPosting(
            id=str(uuid.uuid4()),
            business_id=bid,
            company_id=company_id,
            title=data.title,
            department_id=data.department_id,
            hiring_manager_id=data.hiring_manager_id,
            recruiter_id=data.recruiter_id,
            employment_type=data.employment_type.value if data.employment_type else None,
            experience_level=data.experience_level.value if data.experience_level else None,
            location=data.location,
            salary_min=data.salary_min,
            salary_max=data.salary_max,
            currency=data.currency,
            openings=data.openings,
            description=data.description,
            requirements=data.requirements,
            status=JobStatus.DRAFT.value,
            closing_date=data.closing_date,
            created_by=created_by,
        )
        self.db.add(job)
        await self.db.flush()
        await self.db.refresh(job)
        return job

    async def list_jobs(
        self,
        company_id: str,
        params: PaginationParams,
        status: Optional[str] = None,
    ) -> Tuple[List[JobPosting], int]:
        filters = {}
        if status:
            filters["status"] = status
        conditions = []
        if params.q:
            q = f"%{params.q}%"
            conditions.append(
                or_(
                    JobPosting.title.ilike(q),
                    JobPosting.location.ilike(q),
                    JobPosting.business_id.ilike(q),
                )
            )
        return await self.job_repo.list(
            company_id=company_id, params=params, filters=filters, extra_conditions=conditions
        )

    async def get_job(self, business_id: str, company_id: str) -> JobPosting:
        return await self.job_repo.get_or_404(business_id, company_id)

    async def update_job(self, business_id: str, data: JobPostingUpdate, company_id: str, updated_by: str) -> JobPosting:
        job = await self.job_repo.get_or_404(business_id, company_id)
        update_dict = data.model_dump(exclude_unset=True)
        for key in ("employment_type", "experience_level"):
            if key in update_dict and update_dict[key] and hasattr(update_dict[key], "value"):
                update_dict[key] = update_dict[key].value
        update_dict["updated_by"] = updated_by
        return await self.job_repo.update(job, update_dict)

    async def update_job_status(self, business_id: str, data: JobPostingStatusUpdate, company_id: str, updated_by: str) -> JobPosting:
        job = await self.job_repo.get_or_404(business_id, company_id)
        job.status = data.status.value
        if data.status == JobStatus.OPEN and not job.posted_at:
            job.posted_at = datetime.now(tz=timezone.utc)
        job.updated_by = updated_by
        await self.db.flush()
        await self.db.refresh(job)
        return job

    # ── Candidates ─────────────────────────────────────────────────────────
    async def create_candidate(self, data: CandidateCreate, company_id: str, created_by: str) -> Candidate:
        existing = await self.db.execute(
            select(Candidate).where(
                Candidate.email == data.email,
                Candidate.company_id == company_id,
                Candidate.is_deleted == False,
            )
        )
        if existing.scalar_one_or_none():
            raise ConflictException(f"Candidate with email '{data.email}' already exists")

        bid = await BusinessIdService.generate(self.db, "candidate")
        candidate = Candidate(
            id=str(uuid.uuid4()),
            business_id=bid,
            company_id=company_id,
            full_name=data.full_name,
            first_name=data.first_name,
            last_name=data.last_name,
            email=data.email,
            phone=data.phone,
            current_location=data.current_location,
            years_of_experience=data.years_of_experience,
            current_company=data.current_company,
            current_role=data.current_role,
            expected_salary=data.expected_salary,
            notice_period=data.notice_period,
            resume_url=data.resume_url,
            linkedin_url=data.linkedin_url,
            portfolio_url=data.portfolio_url,
            source=data.source.value if data.source else None,
            source_details=data.source_details,
            tags=data.tags,
            created_by=created_by,
        )
        self.db.add(candidate)
        await self.db.flush()
        await self.db.refresh(candidate)
        return candidate

    async def list_candidates(
        self, company_id: str, params: PaginationParams
    ) -> Tuple[List[Candidate], int]:
        conditions = []
        if params.q:
            q = f"%{params.q}%"
            conditions.append(
                or_(
                    Candidate.full_name.ilike(q),
                    Candidate.email.ilike(q),
                    Candidate.current_company.ilike(q),
                    Candidate.current_role.ilike(q),
                    Candidate.business_id.ilike(q),
                )
            )
        return await self.candidate_repo.list(
            company_id=company_id, params=params, extra_conditions=conditions
        )

    async def get_candidate(self, business_id: str, company_id: str) -> Candidate:
        return await self.candidate_repo.get_or_404(business_id, company_id)

    async def update_candidate(self, business_id: str, data: CandidateUpdate, company_id: str, updated_by: str) -> Candidate:
        candidate = await self.candidate_repo.get_or_404(business_id, company_id)
        update_dict = data.model_dump(exclude_unset=True)
        if "source" in update_dict and update_dict["source"] and hasattr(update_dict["source"], "value"):
            update_dict["source"] = update_dict["source"].value
        update_dict["updated_by"] = updated_by
        return await self.candidate_repo.update(candidate, update_dict)

    # ── Applications ────────────────────────────────────────────────────────
    async def create_application(self, data: ApplicationCreate, company_id: str, created_by: str) -> Application:
        # Prevent duplicate application
        existing = await self.db.execute(
            select(Application).where(
                Application.candidate_id == data.candidate_id,
                Application.job_posting_id == data.job_posting_id,
                Application.company_id == company_id,
                Application.is_deleted == False,
            )
        )
        if existing.scalar_one_or_none():
            raise ConflictException("Candidate has already applied for this job")

        bid = await BusinessIdService.generate(self.db, "application")
        app = Application(
            id=str(uuid.uuid4()),
            business_id=bid,
            company_id=company_id,
            candidate_id=data.candidate_id,
            job_posting_id=data.job_posting_id,
            source=data.source,
            recruiter_notes=data.recruiter_notes,
            applied_at=datetime.now(tz=timezone.utc),
            ai_screening_status=AIScreeningStatus.PENDING.value,
            created_by=created_by,
        )
        self.db.add(app)
        await self.db.flush()
        await self.db.refresh(app)
        return app

    async def list_applications(
        self,
        company_id: str,
        params: PaginationParams,
        job_id: Optional[str] = None,
        stage: Optional[str] = None,
        status: Optional[str] = None,
    ) -> Tuple[List[Application], int]:
        filters = {}
        if job_id:
            filters["job_posting_id"] = job_id
        if stage:
            filters["current_stage"] = stage
        if status:
            filters["application_status"] = status
        return await self.application_repo.list(
            company_id=company_id, params=params, filters=filters
        )

    async def get_application(self, business_id: str, company_id: str) -> Application:
        return await self.application_repo.get_or_404(business_id, company_id)

    async def update_stage(self, business_id: str, data: ApplicationStageUpdate, company_id: str, updated_by: str) -> Application:
        app = await self.application_repo.get_or_404(business_id, company_id)
        app.current_stage = data.current_stage.value
        now = datetime.now(tz=timezone.utc)
        if data.current_stage == ApplicationStage.SHORTLISTED:
            app.shortlisted_at = now
        elif data.current_stage == ApplicationStage.HIRED:
            app.hired_at = now
            app.application_status = "hired"
        elif data.current_stage == ApplicationStage.REJECTED:
            app.rejected_at = now
            app.application_status = "rejected"
        if data.recruiter_notes:
            app.recruiter_notes = data.recruiter_notes
        app.updated_by = updated_by
        await self.db.flush()
        await self.db.refresh(app)
        return app

    async def update_status(self, business_id: str, data: ApplicationStatusUpdate, company_id: str, updated_by: str) -> Application:
        app = await self.application_repo.get_or_404(business_id, company_id)
        app.application_status = data.application_status.value
        app.updated_by = updated_by
        await self.db.flush()
        await self.db.refresh(app)
        return app

    async def get_applications_count(self, job_id: str) -> int:
        result = await self.db.execute(
            select(func.count()).select_from(Application).where(
                Application.job_posting_id == job_id,
                Application.is_deleted == False,
            )
        )
        return result.scalar() or 0


class InterviewService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = BaseRepository(Interview, db)

    async def create(self, data: InterviewCreate, company_id: str, created_by: str) -> Interview:
        bid = await BusinessIdService.generate(self.db, "interview")
        interview = Interview(
            id=str(uuid.uuid4()),
            business_id=bid,
            company_id=company_id,
            application_id=data.application_id,
            candidate_id=data.candidate_id,
            job_posting_id=data.job_posting_id,
            interview_type=data.interview_type.value if data.interview_type else None,
            round_name=data.round_name,
            scheduled_at=data.scheduled_at,
            duration_minutes=data.duration_minutes,
            meeting_link=data.meeting_link,
            interviewer_id=data.interviewer_id,
            interview_status="scheduled",
            created_by=created_by,
        )
        self.db.add(interview)
        await self.db.flush()
        await self.db.refresh(interview)
        return interview

    async def list(
        self,
        company_id: str,
        params: PaginationParams,
        application_id: Optional[str] = None,
    ) -> Tuple[List[Interview], int]:
        filters = {}
        if application_id:
            filters["application_id"] = application_id
        return await self.repo.list(company_id=company_id, params=params, filters=filters)

    async def get(self, business_id: str, company_id: str) -> Interview:
        return await self.repo.get_or_404(business_id, company_id)

    async def update(self, business_id: str, data: InterviewUpdate, company_id: str, updated_by: str) -> Interview:
        interview = await self.repo.get_or_404(business_id, company_id)
        update_dict = data.model_dump(exclude_unset=True)
        for key in ("interview_type", "interview_status"):
            if key in update_dict and update_dict[key] and hasattr(update_dict[key], "value"):
                update_dict[key] = update_dict[key].value
        update_dict["updated_by"] = updated_by
        return await self.repo.update(interview, update_dict)


class OfferService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = BaseRepository(Offer, db)

    async def create(self, data: OfferCreate, company_id: str, created_by: str) -> Offer:
        bid = await BusinessIdService.generate(self.db, "offer")
        offer = Offer(
            id=str(uuid.uuid4()),
            business_id=bid,
            company_id=company_id,
            application_id=data.application_id,
            candidate_id=data.candidate_id,
            offered_role=data.offered_role,
            offered_salary=data.offered_salary,
            currency=data.currency,
            joining_date=data.joining_date,
            notes=data.notes,
            offer_status=OfferStatus.DRAFT.value,
            created_by=created_by,
        )
        self.db.add(offer)
        await self.db.flush()
        await self.db.refresh(offer)
        return offer

    async def list(self, company_id: str, params: PaginationParams) -> Tuple[List[Offer], int]:
        return await self.repo.list(company_id=company_id, params=params)

    async def get(self, business_id: str, company_id: str) -> Offer:
        return await self.repo.get_or_404(business_id, company_id)

    async def update_status(self, business_id: str, data: OfferStatusUpdate, company_id: str, updated_by: str) -> Offer:
        offer = await self.repo.get_or_404(business_id, company_id)
        now = datetime.now(tz=timezone.utc)
        offer.offer_status = data.offer_status.value
        if data.offer_status == OfferStatus.SENT:
            offer.sent_at = now
        elif data.offer_status == OfferStatus.ACCEPTED:
            offer.accepted_at = now
        elif data.offer_status == OfferStatus.DECLINED:
            offer.declined_at = now
        if data.notes:
            offer.notes = data.notes
        offer.updated_by = updated_by
        await self.db.flush()
        await self.db.refresh(offer)
        return offer
