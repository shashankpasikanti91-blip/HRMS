from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_hr_or_above
from app.models.user import User
from app.schemas.analytics import (
    DashboardStatsResponse,
    AttendanceSummaryResponse,
    RecruitmentFunnelResponse,
    HeadcountByDepartmentResponse,
    LeaveSummaryResponse,
    PayrollSummaryResponse,
)
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard", response_model=DashboardStatsResponse)
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    """Main dashboard stats: headcount, attendance rate, open jobs, etc."""
    svc = AnalyticsService(db)
    stats = await svc.get_dashboard_stats(current_user.company_id)
    return stats


@router.get("/attendance", response_model=AttendanceSummaryResponse)
async def get_attendance_summary(
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    """Attendance rate per day for the last N days."""
    svc = AnalyticsService(db)
    summary = await svc.get_attendance_summary(current_user.company_id, days=days)
    return summary


@router.get("/recruitment-funnel", response_model=RecruitmentFunnelResponse)
async def get_recruitment_funnel(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    """Number of applications at each recruitment stage."""
    svc = AnalyticsService(db)
    funnel = await svc.get_recruitment_funnel(current_user.company_id)
    return funnel


@router.get("/headcount", response_model=HeadcountByDepartmentResponse)
async def get_headcount_by_department(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    """Active/total employee count per department."""
    svc = AnalyticsService(db)
    headcount = await svc.get_headcount_by_department(current_user.company_id)
    return headcount


@router.get("/leave-summary", response_model=LeaveSummaryResponse)
async def get_leave_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    """Leave request breakdown by type and status."""
    svc = AnalyticsService(db)
    leave = await svc.get_leave_summary(current_user.company_id)
    return leave


@router.get("/payroll-summary", response_model=PayrollSummaryResponse)
async def get_payroll_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    """Payroll totals for the last 12 runs."""
    svc = AnalyticsService(db)
    payroll = await svc.get_payroll_summary(current_user.company_id)
    return payroll
