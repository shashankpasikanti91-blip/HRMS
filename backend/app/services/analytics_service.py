from __future__ import annotations

from datetime import date
from typing import List, Optional

from sqlalchemy import select, func, and_, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.employee import Employee, Department
from app.models.attendance import Attendance, LeaveRequest
from app.models.recruitment import JobPosting, Candidate, Application
from app.models.interview import Interview, Offer
from app.models.payroll import PayrollRun, PayrollItem
from app.schemas.analytics import (
    DashboardStats,
    AttendanceSummary,
    RecruitmentFunnel,
    RecruitmentFunnelItem,
    HeadcountByDepartment,
    LeaveSummary,
    PayrollSummary,
)
from app.utils.enums import ApplicationStage, OfferStatus
from app.utils.helpers import safe_divide


class AnalyticsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_dashboard_stats(self, company_id: str) -> DashboardStats:
        today = date.today()

        # Employee counts
        total_emp = await self._count(Employee, company_id)
        active_emp = await self._count(Employee, company_id, "employment_status", "active")

        # Today's attendance
        present_today = await self._count_attendance_by_status(company_id, today, "present")
        absent_today = await self._count_attendance_by_status(company_id, today, "absent")
        on_leave_today = await self._count_attendance_by_status(company_id, today, "on_leave")

        # Jobs
        open_jobs = await self._count(JobPosting, company_id, "status", "open")

        # Candidates
        total_candidates = await self._count(Candidate, company_id)
        screening = await self._count(Application, company_id, "current_stage", "screening")

        # Interviews today/upcoming
        interviews_result = await self.db.execute(
            select(func.count()).select_from(Interview).where(
                Interview.company_id == company_id,
                Interview.interview_status.in_(["scheduled", "confirmed"]),
                Interview.is_deleted == False,
            )
        )
        interviews_scheduled = interviews_result.scalar() or 0

        # Pending offers
        pending_offers_result = await self.db.execute(
            select(func.count()).select_from(Offer).where(
                Offer.company_id == company_id,
                Offer.offer_status == OfferStatus.SENT.value,
                Offer.is_deleted == False,
            )
        )
        offers_pending = pending_offers_result.scalar() or 0

        # Hires this month
        from datetime import datetime, timezone
        now = datetime.now(tz=timezone.utc)
        hires_result = await self.db.execute(
            select(func.count()).select_from(Application).where(
                Application.company_id == company_id,
                Application.current_stage == ApplicationStage.HIRED.value,
                func.extract("month", Application.hired_at) == now.month,
                func.extract("year", Application.hired_at) == now.year,
                Application.is_deleted == False,
            )
        )
        hires_this_month = hires_result.scalar() or 0

        # Pending leave requests
        leave_pending_result = await self.db.execute(
            select(func.count()).select_from(LeaveRequest).where(
                LeaveRequest.company_id == company_id,
                LeaveRequest.status == "pending",
                LeaveRequest.is_deleted == False,
            )
        )
        leave_requests_pending = leave_pending_result.scalar() or 0

        # Department count
        dept_count = await self._count(Department, company_id)

        # New employees this month
        new_emp_result = await self.db.execute(
            select(func.count()).select_from(Employee).where(
                Employee.company_id == company_id,
                func.extract("month", Employee.joining_date) == now.month,
                func.extract("year", Employee.joining_date) == now.year,
                Employee.is_deleted == False,
            )
        )
        new_employees_this_month = new_emp_result.scalar() or 0

        return DashboardStats(
            total_employees=total_emp,
            active_employees=active_emp,
            present_today=present_today,
            absent_today=absent_today,
            on_leave_today=on_leave_today,
            open_jobs=open_jobs,
            total_candidates=total_candidates,
            candidates_in_screening=screening,
            interviews_scheduled=interviews_scheduled,
            offers_pending=offers_pending,
            hires_this_month=hires_this_month,
            leave_requests_pending=leave_requests_pending,
            departments_count=dept_count,
            new_employees_this_month=new_employees_this_month,
        )

    async def get_attendance_summary(self, company_id: str, target_date: Optional[date] = None) -> AttendanceSummary:
        d = target_date or date.today()
        total_employees = await self._count(Employee, company_id, "employment_status", "active")

        statuses = ["present", "absent", "late", "half_day", "on_leave", "work_from_home"]
        counts = {}
        for s in statuses:
            counts[s] = await self._count_attendance_by_status(company_id, d, s)

        present = counts.get("present", 0)
        pct = safe_divide(present * 100.0, total_employees) if total_employees else 0.0

        return AttendanceSummary(
            date=str(d),
            present=counts["present"],
            absent=counts["absent"],
            late=counts["late"],
            half_day=counts["half_day"],
            on_leave=counts["on_leave"],
            work_from_home=counts["work_from_home"],
            total_employees=total_employees,
            attendance_percentage=round(pct, 1),
        )

    async def get_attendance_summary_range(self, company_id: str, days: int = 30) -> List[AttendanceSummary]:
        """Return attendance summaries for the last N days."""
        from datetime import timedelta
        today = date.today()
        results = []
        for i in range(days - 1, -1, -1):
            d = today - timedelta(days=i)
            summary = await self.get_attendance_summary(company_id, target_date=d)
            results.append(summary)
        return results

    async def get_recruitment_funnel(self, company_id: str, job_id: Optional[str] = None) -> RecruitmentFunnel:
        stages = [s.value for s in ApplicationStage]
        stage_counts = []
        total = 0

        for stage in stages:
            stmt = select(func.count()).select_from(Application).where(
                Application.company_id == company_id,
                Application.current_stage == stage,
                Application.is_deleted == False,
            )
            if job_id:
                stmt = stmt.where(Application.job_posting_id == job_id)
            result = await self.db.execute(stmt)
            count = result.scalar() or 0
            total += count
            stage_counts.append((stage, count))

        items = [
            RecruitmentFunnelItem(
                stage=s,
                count=c,
                percentage=round(safe_divide(c * 100.0, total), 1) if total else 0.0,
            )
            for s, c in stage_counts
        ]
        return RecruitmentFunnel(
            job_id=job_id,
            stages=items,
            total_applications=total,
        )

    async def get_headcount_by_department(self, company_id: str) -> List[HeadcountByDepartment]:
        # Single query with GROUP BY to avoid N+1
        result = await self.db.execute(
            select(
                Department.id,
                Department.name,
                func.count(Employee.id).label("total"),
                func.count(
                    case(
                        (Employee.employment_status == "active", Employee.id),
                    )
                ).label("active"),
            )
            .outerjoin(
                Employee,
                (Employee.department_id == Department.id)
                & (Employee.is_deleted == False),
            )
            .where(
                Department.company_id == company_id,
                Department.is_deleted == False,
            )
            .group_by(Department.id, Department.name)
        )
        rows = result.all()
        return [
            HeadcountByDepartment(
                department_id=dept_id,
                department_name=dept_name,
                total=total,
                active=active,
            )
            for dept_id, dept_name, total, active in rows
        ]

    async def get_leave_summary(self, company_id: str) -> List[LeaveSummary]:
        # Single query with conditional aggregation to avoid N+1
        result = await self.db.execute(
            select(
                LeaveRequest.leave_type,
                func.count().label("total"),
                func.count(case((LeaveRequest.status == "approved", 1))).label("approved"),
                func.count(case((LeaveRequest.status == "pending", 1))).label("pending"),
                func.count(case((LeaveRequest.status == "rejected", 1))).label("rejected"),
            )
            .where(LeaveRequest.company_id == company_id, LeaveRequest.is_deleted == False)
            .group_by(LeaveRequest.leave_type)
        )
        rows = result.all()
        return [
            LeaveSummary(
                leave_type=leave_type,
                total_requests=total,
                approved=approved,
                pending=pending,
                rejected=rejected,
            )
            for leave_type, total, approved, pending, rejected in rows
        ]

    async def get_payroll_summary(self, company_id: str) -> List[PayrollSummary]:
        result = await self.db.execute(
            select(PayrollRun).where(
                PayrollRun.company_id == company_id,
                PayrollRun.is_deleted == False,
            ).order_by(PayrollRun.period_year.desc(), PayrollRun.period_month.desc()).limit(12)
        )
        runs = list(result.scalars().all())
        return [
            PayrollSummary(
                period_month=r.period_month,
                period_year=r.period_year,
                total_employees=r.total_employees,
                total_gross=r.total_gross,
                total_deductions=r.total_deductions,
                total_net=r.total_net,
                currency=r.currency,
                status=r.status,
            )
            for r in runs
        ]

    # ── Helpers ────────────────────────────────────────────────────────────
    async def _count(self, model, company_id: str, field: Optional[str] = None, value: Optional[str] = None) -> int:
        stmt = select(func.count()).select_from(model).where(
            model.company_id == company_id,
            model.is_deleted == False,
        )
        if field and value:
            stmt = stmt.where(getattr(model, field) == value)
        result = await self.db.execute(stmt)
        return result.scalar() or 0

    async def _count_attendance_by_status(self, company_id: str, d: date, status: str) -> int:
        result = await self.db.execute(
            select(func.count()).select_from(Attendance).where(
                Attendance.company_id == company_id,
                Attendance.attendance_date == d,
                Attendance.status == status,
                Attendance.is_deleted == False,
            )
        )
        return result.scalar() or 0

    async def _count_leave(self, company_id: str, leave_type: str, status: str) -> int:
        result = await self.db.execute(
            select(func.count()).select_from(LeaveRequest).where(
                LeaveRequest.company_id == company_id,
                LeaveRequest.leave_type == leave_type,
                LeaveRequest.status == status,
                LeaveRequest.is_deleted == False,
            )
        )
        return result.scalar() or 0
