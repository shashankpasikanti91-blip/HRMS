from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_hr_or_above
from app.core.pagination import PaginationParams, Page
from app.models.user import User
from app.schemas.payroll import (
    PayrollRunCreate,
    PayrollRunResponse,
    PayrollItemResponse,
)
from app.services.payroll_service import PayrollService

router = APIRouter(prefix="/payroll", tags=["Payroll"])


@router.get("/me/payslips")
async def get_my_payslips(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the current user's own payslips across all payroll runs."""
    from sqlalchemy import select as sa_select
    from app.models.employee import Employee
    from app.models.payroll import PayrollItem, PayrollRun

    # Find employee record for current user
    emp_result = await db.execute(
        sa_select(Employee).where(
            Employee.user_id == current_user.id,
            Employee.company_id == current_user.company_id,
            Employee.is_deleted == False,
        )
    )
    emp = emp_result.scalar_one_or_none()
    if not emp:
        return []

    # Get all payroll items for this employee
    items_result = await db.execute(
        sa_select(PayrollItem, PayrollRun.period_month, PayrollRun.period_year, PayrollRun.status.label("run_status"))
        .join(PayrollRun, PayrollItem.payroll_run_id == PayrollRun.id)
        .where(
            PayrollItem.employee_id == emp.id,
            PayrollItem.company_id == current_user.company_id,
            PayrollItem.is_deleted == False,
        )
        .order_by(PayrollRun.period_year.desc(), PayrollRun.period_month.desc())
    )
    rows = items_result.all()
    payslips = []
    for row in rows:
        item = row[0]
        payslips.append({
            "business_id": item.business_id,
            "period_month": row[1],
            "period_year": row[2],
            "run_status": row[3],
            "gross_salary": float(item.gross_salary or 0),
            "allowances": float(item.allowances or 0),
            "deductions": float(item.deductions or 0),
            "tax_amount": float(item.tax_amount or 0),
            "net_salary": float(item.net_salary or 0),
            "currency": item.currency or "INR",
            "payment_status": item.payment_status or "pending",
            "payment_date": str(item.payment_date) if item.payment_date else None,
        })
    return payslips


@router.post("/runs", response_model=PayrollRunResponse, status_code=201)
async def create_payroll_run(
    data: PayrollRunCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    """Create a new payroll run for a given month/year."""
    svc = PayrollService(db)
    run = await svc.create_run(data, current_user.company_id, current_user.id)
    return PayrollRunResponse.model_validate(run)


@router.get("/runs", response_model=Page[PayrollRunResponse])
async def list_payroll_runs(
    params: PaginationParams = Depends(),
    year: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    svc = PayrollService(db)
    runs, total = await svc.list_runs(current_user.company_id, params, year=year)
    return Page.create([PayrollRunResponse.model_validate(r) for r in runs], total, params)


@router.get("/runs/{business_id}", response_model=PayrollRunResponse)
async def get_payroll_run(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    svc = PayrollService(db)
    run = await svc.get_run(business_id, current_user.company_id)
    return PayrollRunResponse.model_validate(run)


@router.post("/runs/{business_id}/process", response_model=PayrollRunResponse)
async def process_payroll_run(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    """Calculate and create payroll items for all active employees."""
    svc = PayrollService(db)
    run = await svc.process_run(business_id, current_user.company_id, current_user.id)
    return PayrollRunResponse.model_validate(run)


@router.post("/runs/{business_id}/approve", response_model=PayrollRunResponse)
async def approve_payroll_run(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    """Approve a processed payroll run."""
    svc = PayrollService(db)
    run = await svc.approve_run(business_id, current_user.company_id, current_user.id)
    return PayrollRunResponse.model_validate(run)


@router.get("/runs/{business_id}/items", response_model=Page[PayrollItemResponse])
async def get_payroll_items(
    business_id: str,
    params: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    """Get all payroll items (employee slips) for a payroll run."""
    svc = PayrollService(db)
    items, total = await svc.get_items(business_id, current_user.company_id, params)
    # Enrich items with employee name/code
    from sqlalchemy import select as sa_select
    from app.models.employee import Employee
    enriched = []
    for i in items:
        resp = PayrollItemResponse.model_validate(i)
        # Set computed fields for frontend compatibility
        resp.basic_salary = float(getattr(i, "basic_salary", 0) or 0)
        resp.total_deductions = float(getattr(i, "total_deductions", 0) or 0) or float((i.deductions or 0) + (i.tax_amount or 0))
        emp_result = await db.execute(
            sa_select(Employee.first_name, Employee.last_name, Employee.employee_code, Employee.business_id)
            .where(Employee.id == i.employee_id)
        )
        emp = emp_result.first()
        if emp:
            resp.employee_name = f"{emp.first_name or ''} {emp.last_name or ''}".strip() or None
            resp.employee_code = emp.employee_code
        enriched.append(resp)
    return Page.create(enriched, total, params)


@router.get("/items/{item_business_id}", response_model=dict)
async def get_payroll_item_detail(
    item_business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get detailed payslip for a single employee including company info.
    Employees may only view their own payslip; HR+ and super_admin can view any."""
    from sqlalchemy import select as sa_select
    from app.models.employee import Employee, Department
    from app.models.payroll import PayrollItem, PayrollRun
    from app.models.company import Company
    from app.core.exceptions import NotFoundException
    from app.utils.enums import UserRole

    is_hr_or_above = current_user.role in (
        UserRole.SUPER_ADMIN.value,
        UserRole.COMPANY_ADMIN.value,
        UserRole.HR_MANAGER.value,
        UserRole.FINANCE.value,
    )

    # Build base query
    conditions = [
        PayrollItem.business_id == item_business_id,
        PayrollItem.is_deleted == False,
    ]
    # Scope by company unless super_admin
    if current_user.company_id:
        conditions.append(PayrollItem.company_id == current_user.company_id)

    item_result = await db.execute(sa_select(PayrollItem).where(*conditions))
    item = item_result.scalar_one_or_none()
    if not item:
        raise NotFoundException("Payslip not found")

    # Employees may only view their own payslip
    if not is_hr_or_above:
        emp_result = await db.execute(
            sa_select(Employee).where(
                Employee.user_id == current_user.id,
                Employee.is_deleted == False,
            )
        )
        own_employee = emp_result.scalar_one_or_none()
        if not own_employee or own_employee.id != item.employee_id:
            raise NotFoundException("Payslip not found")

    # Get employee details with department name via join
    emp_result = await db.execute(
        sa_select(Employee, Department.name.label("dept_name"))
        .outerjoin(Department, Employee.department_id == Department.id)  # type: ignore[attr-defined]
        .where(Employee.id == item.employee_id)
    )
    emp_row = emp_result.first()
    emp = emp_row[0] if emp_row else None
    dept_name = emp_row[1] if emp_row else None

    # Get payroll run
    run_result = await db.execute(
        sa_select(PayrollRun).where(PayrollRun.id == item.payroll_run_id)
    )
    run = run_result.scalar_one_or_none()

    # Get company info (use item's company_id so super_admin also gets it)
    company_result = await db.execute(
        sa_select(Company).where(Company.id == item.company_id)
    )
    company = company_result.scalar_one_or_none()

    return {
        "payslip": {
            "business_id": item.business_id,
            "basic_salary": float(getattr(item, "basic_salary", 0) or 0),
            "gross_salary": float(item.gross_salary or 0),
            "allowances": float(item.allowances or 0),
            "deductions": float(item.deductions or 0),
            "tax_amount": float(item.tax_amount or 0),
            "total_deductions": float(getattr(item, "total_deductions", 0) or 0) or float((item.deductions or 0) + (item.tax_amount or 0)),
            "net_salary": float(item.net_salary or 0),
            "currency": item.currency or "INR",
            "payment_status": item.payment_status or "pending",
            "payment_date": str(item.payment_date) if item.payment_date else None,
        },
        "employee": {
            "business_id": emp.business_id,
            "full_name": f"{emp.first_name or ''} {emp.last_name or ''}".strip() or emp.full_name or "Unknown",
            "employee_code": emp.employee_code,
            "work_email": emp.work_email,
            "department_name": dept_name,
            "designation": emp.designation,
            "joining_date": str(emp.joining_date) if emp.joining_date else None,
        } if emp else None,
        "payroll_run": {
            "business_id": run.business_id,
            "period_month": run.period_month,
            "period_year": run.period_year,
            "status": run.status,
        } if run else None,
        "company": {
            "name": company.name,
            "legal_name": getattr(company, "legal_name", None),
            "email": getattr(company, "email", None),
            "phone": getattr(company, "phone", None),
            "address": getattr(company, "address", None),
            "city": getattr(company, "city", None),
            "country": getattr(company, "country", None),
            "logo_url": getattr(company, "logo_url", None),
        } if company else None,
    }
