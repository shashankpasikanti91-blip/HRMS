from fastapi import APIRouter
from typing import List
from pydantic import BaseModel
from app.models.schemas import ResumeScreenRequest, ResumeScreenResponse
from app.services.resume_service import resume_service

router = APIRouter()


class BatchScreenRequest(BaseModel):
    tenant_id: str
    job_id: str
    job_description: str
    requirements: List[str] = []
    resumes: List[dict]


@router.post("/screen", response_model=ResumeScreenResponse)
async def screen_resume(request: ResumeScreenRequest):
    """Screen a single resume against a job posting."""
    result = await resume_service.screen_resume(
        resume_text=request.resume_text or "",
        job_description=request.job_description or "",
        requirements=request.requirements,
    )
    return ResumeScreenResponse(
        candidate_id=request.candidate_id,
        **result,
    )


@router.post("/screen/batch")
async def batch_screen_resumes(request: BatchScreenRequest):
    """Screen multiple resumes and rank candidates."""
    results = await resume_service.batch_screen(
        resumes=request.resumes,
        job_description=request.job_description,
        requirements=request.requirements,
    )
    return {"job_id": request.job_id, "total_screened": len(results), "results": results}
