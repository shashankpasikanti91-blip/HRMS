from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_hr_or_above
from app.core.pagination import PaginationParams, Page
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
    return Page.create([DepartmentSummary.model_validate(d) for d in depts], total, params)


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
    return Page.create([EmployeeSummary.model_validate(e) for e in employees], total, params)


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
    return Page.create([EmployeeSummary.model_validate(e) for e in employees], total, params)


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


def _format_employee(emp, db, company_id):
    return EmployeeResponse.model_validate(emp)
