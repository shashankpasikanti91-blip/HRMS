from __future__ import annotations

from typing import Optional

from app.schemas.base import BaseSchema, BaseResponse
from app.utils.enums import PerformanceStatus, ReviewPeriod


class PerformanceReviewCreate(BaseSchema):
    employee_id: str
    reviewer_id: Optional[str] = None
    review_period: Optional[ReviewPeriod] = None
    review_year: Optional[int] = None
    goal_score: Optional[float] = None
    behavior_score: Optional[float] = None
    comments: Optional[str] = None
    employee_self_review: Optional[str] = None


class PerformanceReviewUpdate(BaseSchema):
    goal_score: Optional[float] = None
    behavior_score: Optional[float] = None
    comments: Optional[str] = None
    employee_self_review: Optional[str] = None
    status: Optional[PerformanceStatus] = None


class PerformanceReviewResponse(BaseResponse):
    company_id: str
    employee_id: str
    employee_name: Optional[str] = None
    reviewer_id: Optional[str] = None
    reviewer_name: Optional[str] = None
    review_period: Optional[str] = None
    review_year: Optional[int] = None
    goal_score: Optional[float] = None
    behavior_score: Optional[float] = None
    overall_score: Optional[float] = None
    comments: Optional[str] = None
    employee_self_review: Optional[str] = None
    status: str
