from __future__ import annotations

from typing import List

from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.employee import Employee, Department
from app.models.recruitment import JobPosting, Candidate, Application
from app.models.attendance import Attendance, LeaveRequest
from app.schemas.search import SearchResultItem, GlobalSearchResponse
from app.utils.constants import GLOBAL_SEARCH_MAX_RESULTS_PER_TYPE


class SearchService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def global_search(self, q: str, company_id: str) -> GlobalSearchResponse:
        results: List[SearchResultItem] = []
        like = f"%{q}%"

        # ── Employees ─────────────────────────────────────────────────────
        emp_stmt = select(Employee).where(
            Employee.company_id == company_id,
            Employee.is_deleted == False,
            or_(
                Employee.full_name.ilike(like),
                Employee.work_email.ilike(like),
                Employee.employee_code.ilike(like),
                Employee.business_id.ilike(like),
                Employee.phone.ilike(like),
                Employee.designation.ilike(like),
            ),
        ).limit(GLOBAL_SEARCH_MAX_RESULTS_PER_TYPE)
        emp_result = await self.db.execute(emp_stmt)
        employees = list(emp_result.scalars().all())

        # Fetch departments for employees
        dept_ids = {e.department_id for e in employees if e.department_id}
        dept_map = {}
        if dept_ids:
            dept_res = await self.db.execute(
                select(Department).where(Department.id.in_(dept_ids))
            )
            for d in dept_res.scalars().all():
                dept_map[d.id] = d.name

        for emp in employees:
            dept_name = dept_map.get(emp.department_id or "", "")
            subtitle = " | ".join(filter(None, [emp.designation, dept_name]))
            results.append(SearchResultItem(
                entity_type="employee",
                id=emp.id,
                business_id=emp.business_id,
                title=emp.full_name,
                subtitle=subtitle or emp.work_email,
                status=emp.employment_status,
                open_route=f"/employees/{emp.business_id}",
            ))

        # ── Candidates ─────────────────────────────────────────────────────
        cand_stmt = select(Candidate).where(
            Candidate.company_id == company_id,
            Candidate.is_deleted == False,
            or_(
                Candidate.full_name.ilike(like),
                Candidate.email.ilike(like),
                Candidate.business_id.ilike(like),
                Candidate.phone.ilike(like),
                Candidate.current_role.ilike(like),
                Candidate.current_company.ilike(like),
            ),
        ).limit(GLOBAL_SEARCH_MAX_RESULTS_PER_TYPE)
        cand_result = await self.db.execute(cand_stmt)
        candidates = list(cand_result.scalars().all())

        for cand in candidates:
            subtitle = cand.current_role or cand.current_company or ""
            results.append(SearchResultItem(
                entity_type="candidate",
                id=cand.id,
                business_id=cand.business_id,
                title=cand.full_name,
                subtitle=subtitle,
                status="active" if cand.is_active else "inactive",
                open_route=f"/recruitment/candidates/{cand.business_id}",
            ))

        # ── Job Postings ────────────────────────────────────────────────────
        job_stmt = select(JobPosting).where(
            JobPosting.company_id == company_id,
            JobPosting.is_deleted == False,
            or_(
                JobPosting.title.ilike(like),
                JobPosting.business_id.ilike(like),
                JobPosting.location.ilike(like),
            ),
        ).limit(GLOBAL_SEARCH_MAX_RESULTS_PER_TYPE)
        job_result = await self.db.execute(job_stmt)
        jobs = list(job_result.scalars().all())

        for job in jobs:
            results.append(SearchResultItem(
                entity_type="job_posting",
                id=job.id,
                business_id=job.business_id,
                title=job.title,
                subtitle=job.location or "",
                status=job.status,
                open_route=f"/recruitment/jobs/{job.business_id}",
            ))

        # ── Departments ─────────────────────────────────────────────────────
        dept_stmt = select(Department).where(
            Department.company_id == company_id,
            Department.is_deleted == False,
            or_(
                Department.name.ilike(like),
                Department.code.ilike(like),
                Department.business_id.ilike(like),
            ),
        ).limit(GLOBAL_SEARCH_MAX_RESULTS_PER_TYPE)
        dept_result2 = await self.db.execute(dept_stmt)
        departments = list(dept_result2.scalars().all())

        for dept in departments:
            results.append(SearchResultItem(
                entity_type="department",
                id=dept.id,
                business_id=dept.business_id,
                title=dept.name,
                subtitle=dept.code or "",
                status="active" if dept.is_active else "inactive",
                open_route=f"/departments/{dept.business_id}",
            ))

        # ── Attendance ──────────────────────────────────────────────────────
        att_stmt = select(Attendance).where(
            Attendance.company_id == company_id,
            Attendance.is_deleted == False,
            Attendance.business_id.ilike(like),
        ).limit(GLOBAL_SEARCH_MAX_RESULTS_PER_TYPE)
        att_result = await self.db.execute(att_stmt)
        attendances = list(att_result.scalars().all())
        for att in attendances:
            results.append(SearchResultItem(
                entity_type="attendance",
                id=att.id,
                business_id=att.business_id,
                title=att.business_id,
                subtitle=str(att.attendance_date),
                status=att.status,
                open_route=f"/attendance/{att.business_id}",
            ))

        return GlobalSearchResponse(
            query=q,
            total=len(results),
            results=results,
        )
