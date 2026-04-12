from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query, UploadFile, File
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_hr_or_above
from app.core.pagination import PaginationParams, Page
from app.models.employee import Employee, Department
from app.models.user import User
from app.schemas.employee import (
    DepartmentCreate,
    DepartmentUpdate,
    DepartmentResponse,
    DepartmentSummary,
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeResponse,
    EmployeeSummary,
    EmployeeSummaryDetail,
)
from app.services.employee_service import DepartmentService, EmployeeService
from app.schemas.base import MessageResponse

dept_router = APIRouter(prefix="/departments", tags=["Departments"])
emp_router = APIRouter(prefix="/employees", tags=["Employees"])


async def _enrich_employee_summaries(employees, db: AsyncSession):
    """Add department_name to a list of Employee ORM objects."""
    dept_ids = {e.department_id for e in employees if e.department_id}
    dept_map = {}
    if dept_ids:
        result = await db.execute(
            select(Department.id, Department.name).where(Department.id.in_(dept_ids))
        )
        dept_map = {row[0]: row[1] for row in result.all()}

    summaries = []
    for e in employees:
        s = EmployeeSummary.model_validate(e)
        if e.department_id and e.department_id in dept_map:
            s.department_name = dept_map[e.department_id]
        summaries.append(s)
    return summaries


# ── Departments ─────────────────────────────────────────────────────────────

@dept_router.post("", response_model=DepartmentResponse, status_code=201)
async def create_department(
    data: DepartmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    svc = DepartmentService(db)
    dept = await svc.create(data, current_user.company_id, current_user.id)
    count = await svc.get_employee_count(dept.id)
    result = DepartmentResponse.model_validate(dept)
    result.employee_count = count
    return result


@dept_router.get("", response_model=Page[DepartmentSummary])
async def list_departments(
    params: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = DepartmentService(db)
    depts, total = await svc.list(current_user.company_id, params)
    summaries = []
    for d in depts:
        s = DepartmentSummary.model_validate(d)
        s.employee_count = await svc.get_employee_count(d.id)
        summaries.append(s)
    return Page.create(summaries, total, params)


@dept_router.get("/{business_id}", response_model=DepartmentResponse)
async def get_department(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = DepartmentService(db)
    dept = await svc.get(business_id, current_user.company_id)
    count = await svc.get_employee_count(dept.id)
    result = DepartmentResponse.model_validate(dept)
    result.employee_count = count
    return result


@dept_router.put("/{business_id}", response_model=DepartmentResponse)
async def update_department(
    business_id: str,
    data: DepartmentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    svc = DepartmentService(db)
    dept = await svc.update(business_id, data, current_user.company_id, current_user.id)
    return DepartmentResponse.model_validate(dept)


@dept_router.delete("/{business_id}", response_model=MessageResponse)
async def delete_department(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    svc = DepartmentService(db)
    await svc.delete(business_id, current_user.company_id, current_user.id)
    return MessageResponse(message=f"Department {business_id} deleted successfully")


# ── Employees ───────────────────────────────────────────────────────────────

@emp_router.post("", response_model=EmployeeResponse, status_code=201)
async def create_employee(
    data: EmployeeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    svc = EmployeeService(db)
    emp = await svc.create(data, current_user.company_id, current_user.id)
    return _format_employee(emp, db, current_user.company_id)


@emp_router.get("", response_model=Page[EmployeeSummary])
async def list_employees(
    params: PaginationParams = Depends(),
    department_id: Optional[str] = Query(None),
    employment_status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = EmployeeService(db)
    employees, total = await svc.list(
        current_user.company_id,
        params,
        department_id=department_id,
        employment_status=employment_status,
    )
    summaries = await _enrich_employee_summaries(employees, db)
    return Page.create(summaries, total, params)


@emp_router.get("/search", response_model=Page[EmployeeSummary])
async def search_employees(
    q: str = Query(..., min_length=1),
    params: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Full-text search across employees."""
    params.q = q
    svc = EmployeeService(db)
    employees, total = await svc.list(current_user.company_id, params)
    summaries = await _enrich_employee_summaries(employees, db)
    return Page.create(summaries, total, params)


@emp_router.get("/{business_id}", response_model=EmployeeResponse)
async def get_employee(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = EmployeeService(db)
    emp = await svc.get(business_id, current_user.company_id)
    return EmployeeResponse.model_validate(emp)


@emp_router.get("/{business_id}/summary", response_model=EmployeeSummaryDetail)
async def get_employee_summary(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get detailed employee summary including attendance, leaves, and manager."""
    svc = EmployeeService(db)
    data = await svc.get_summary(business_id, current_user.company_id)
    return EmployeeSummaryDetail.model_validate(data)


@emp_router.put("/{business_id}", response_model=EmployeeResponse)
async def update_employee(
    business_id: str,
    data: EmployeeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    svc = EmployeeService(db)
    emp = await svc.update(business_id, data, current_user.company_id, current_user.id)
    return EmployeeResponse.model_validate(emp)


@emp_router.delete("/{business_id}", response_model=MessageResponse)
async def delete_employee(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    svc = EmployeeService(db)
    await svc.delete(business_id, current_user.company_id, current_user.id)
    return MessageResponse(message=f"Employee {business_id} deleted successfully")


@emp_router.post("/{business_id}/photo", response_model=EmployeeResponse)
async def upload_employee_photo(
    business_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a profile photo for an employee."""
    from app.integrations.storage_service import StorageService
    svc = EmployeeService(db)
    emp = await svc.get(business_id, current_user.company_id)
    url = await StorageService.upload(file, folder="photos", company_id=current_user.company_id)
    emp.profile_photo_url = url
    await db.flush()
    await db.refresh(emp)
    return EmployeeResponse.model_validate(emp)


def _format_employee(emp, db, company_id):
    return EmployeeResponse.model_validate(emp)
