from __future__ import annotations

from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.performance import PerformanceReview
from app.schemas.performance import PerformanceReviewCreate, PerformanceReviewUpdate
from app.services.business_id_service import BusinessIdService
from app.core.exceptions import NotFoundException, ConflictException
from app.core.pagination import PaginationParams


class PerformanceService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        data: PerformanceReviewCreate,
        company_id: str,
        created_by: str,
    ) -> PerformanceReview:
        bid_svc = BusinessIdService(self.db)
        review = PerformanceReview(
            business_id=await bid_svc.generate("performance_review"),
            company_id=company_id,
            created_by=created_by,
            updated_by=created_by,
            **data.model_dump(),
        )
        self.db.add(review)
        await self.db.commit()
        await self.db.refresh(review)
        return review

    async def list(
        self,
        company_id: str,
        params: PaginationParams,
        employee_id: Optional[str] = None,
        status: Optional[str] = None,
        review_period: Optional[str] = None,
    ) -> tuple[list[PerformanceReview], int]:
        q = select(PerformanceReview).where(
            PerformanceReview.company_id == company_id,
            PerformanceReview.is_deleted == False,
        )
        if employee_id:
            q = q.where(PerformanceReview.employee_id == employee_id)
        if status:
            q = q.where(PerformanceReview.status == status)
        if review_period:
            q = q.where(PerformanceReview.review_period == review_period)

        count_q = select(func.count()).select_from(q.subquery())
        total = (await self.db.execute(count_q)).scalar_one()

        q = q.order_by(PerformanceReview.created_at.desc()).offset(params.skip).limit(params.limit)
        result = await self.db.execute(q)
        return list(result.scalars().all()), total

    async def get(self, business_id: str, company_id: str) -> PerformanceReview:
        result = await self.db.execute(
            select(PerformanceReview).where(
                PerformanceReview.business_id == business_id,
                PerformanceReview.company_id == company_id,
                PerformanceReview.is_deleted == False,
            )
        )
        review = result.scalar_one_or_none()
        if not review:
            raise NotFoundException(f"Performance review {business_id} not found")
        return review

    async def update(
        self,
        business_id: str,
        data: PerformanceReviewUpdate,
        company_id: str,
        updated_by: str,
    ) -> PerformanceReview:
        review = await self.get(business_id, company_id)
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(review, field, value)
        review.updated_by = updated_by
        await self.db.commit()
        await self.db.refresh(review)
        return review

    async def delete(self, business_id: str, company_id: str) -> None:
        review = await self.get(business_id, company_id)
        review.is_deleted = True
        await self.db.commit()
