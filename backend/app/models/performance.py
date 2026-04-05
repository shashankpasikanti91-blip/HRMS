from __future__ import annotations

from typing import Optional

from sqlalchemy import String, ForeignKey, Float, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel
from app.utils.enums import PerformanceStatus, ReviewPeriod


class PerformanceReview(BaseModel):
    __tablename__ = "performance_reviews"

    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    employee_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True
    )
    reviewer_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    review_period: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    review_year: Mapped[Optional[int]] = mapped_column(nullable=True)
    goal_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    behavior_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    overall_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    comments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    employee_self_review: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(30), default=PerformanceStatus.DRAFT.value, nullable=False, index=True
    )
