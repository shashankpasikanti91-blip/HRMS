from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_hr_or_above
from app.core.pagination import PaginationParams, Page
from app.models.user import User
from app.schemas.performance import (
    PerformanceReviewCreate,
    PerformanceReviewUpdate,
    PerformanceReviewResponse,
)
from app.services.performance_service import PerformanceService

router = APIRouter(prefix="/performance", tags=["Performance"])


@router.post("", response_model=PerformanceReviewResponse, status_code=201)
async def create_review(
    data: PerformanceReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    svc = PerformanceService(db)
    review = await svc.create(data, current_user.company_id, current_user.id)
    return PerformanceReviewResponse.model_validate(review)


@router.get("", response_model=Page[PerformanceReviewResponse])
async def list_reviews(
    params: PaginationParams = Depends(),
    employee_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    review_period: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = PerformanceService(db)
    reviews, total = await svc.list(
        current_user.company_id,
        params,
        employee_id=employee_id,
        status=status,
        review_period=review_period,
    )
    return Page.create([PerformanceReviewResponse.model_validate(r) for r in reviews], total, params)


@router.get("/{business_id}", response_model=PerformanceReviewResponse)
async def get_review(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = PerformanceService(db)
    review = await svc.get(business_id, current_user.company_id)
    return PerformanceReviewResponse.model_validate(review)


@router.put("/{business_id}", response_model=PerformanceReviewResponse)
async def update_review(
    business_id: str,
    data: PerformanceReviewUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    svc = PerformanceService(db)
    review = await svc.update(business_id, data, current_user.company_id, current_user.id)
    return PerformanceReviewResponse.model_validate(review)


@router.delete("/{business_id}", status_code=204)
async def delete_review(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    svc = PerformanceService(db)
    await svc.delete(business_id, current_user.company_id)
