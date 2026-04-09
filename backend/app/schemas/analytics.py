from __future__ import annotations

from typing import List, Optional

from app.schemas.base import BaseSchema


class DashboardStats(BaseSchema):
    total_employees: int = 0
    active_employees: int = 0
    present_today: int = 0
    absent_today: int = 0
    on_leave_today: int = 0
    open_jobs: int = 0
    total_candidates: int = 0
    candidates_in_screening: int = 0
    interviews_scheduled: int = 0
    offers_pending: int = 0
    hires_this_month: int = 0
    leave_requests_pending: int = 0
    departments_count: int = 0
    new_employees_this_month: int = 0


class AttendanceSummary(BaseSchema):
    date: str
    present: int = 0
    absent: int = 0
    late: int = 0
    half_day: int = 0
    on_leave: int = 0
    work_from_home: int = 0
    total_employees: int = 0
    attendance_percentage: float = 0.0


class RecruitmentFunnelItem(BaseSchema):
    stage: str
    count: int
    percentage: float = 0.0


class RecruitmentFunnel(BaseSchema):
    job_id: Optional[str] = None
    job_title: Optional[str] = None
    stages: List[RecruitmentFunnelItem]
    total_applications: int = 0


class HeadcountByDepartment(BaseSchema):
    department_id: str
    department_name: str
    total: int = 0
    active: int = 0


class LeaveSummary(BaseSchema):
    leave_type: str
    total_requests: int = 0
    approved: int = 0
    pending: int = 0
    rejected: int = 0


class PayrollSummary(BaseSchema):
    period_month: int
    period_year: int
    total_employees: int = 0
    total_gross: float = 0.0
    total_deductions: float = 0.0
    total_net: float = 0.0
    currency: str = "INR"
    status: str


# Route-friendly Response aliases
DashboardStatsResponse = DashboardStats
AttendanceSummaryResponse = AttendanceSummary
RecruitmentFunnelResponse = RecruitmentFunnel
HeadcountByDepartmentResponse = HeadcountByDepartment
LeaveSummaryResponse = LeaveSummary
PayrollSummaryResponse = PayrollSummary
