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
    current_user: User = Depends(require_hr_or_above()),
):
    """Get detailed payslip for a single employee including company info."""
    from sqlalchemy import select as sa_select
    from app.models.employee import Employee
    from app.models.payroll import PayrollItem, PayrollRun

    # Find payroll item
    item_result = await db.execute(
        sa_select(PayrollItem).where(
            PayrollItem.business_id == item_business_id,
            PayrollItem.company_id == current_user.company_id,
            PayrollItem.is_deleted == False,
        )
    )
    item = item_result.scalar_one_or_none()
    if not item:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("Payslip not found")

    # Get employee details
    emp_result = await db.execute(
        sa_select(Employee).where(Employee.id == item.employee_id)
    )
    emp = emp_result.scalar_one_or_none()

    # Get payroll run
    run_result = await db.execute(
        sa_select(PayrollRun).where(PayrollRun.id == item.payroll_run_id)
    )
    run = run_result.scalar_one_or_none()

    # Get company info
    from app.models.company import Company
    company_result = await db.execute(
        sa_select(Company).where(Company.id == current_user.company_id)
    )
    company = company_result.scalar_one_or_none()

    return {
        "payslip": {
            "business_id": item.business_id,
            "gross_salary": item.gross_salary,
            "allowances": item.allowances,
            "deductions": item.deductions,
            "tax_amount": item.tax_amount,
            "net_salary": item.net_salary,
            "currency": item.currency,
            "payment_status": item.payment_status,
            "payment_date": str(item.payment_date) if item.payment_date else None,
        },
        "employee": {
            "business_id": emp.business_id if emp else None,
            "full_name": f"{emp.first_name or ''} {emp.last_name or ''}".strip() if emp else "Unknown",
            "employee_code": emp.employee_code if emp else None,
            "work_email": emp.work_email if emp else None,
            "department_name": emp.department_name if emp and hasattr(emp, "department_name") else None,
            "designation": emp.designation if emp else None,
            "joining_date": str(emp.joining_date) if emp and emp.joining_date else None,
        } if emp else None,
        "payroll_run": {
            "business_id": run.business_id if run else None,
            "period_month": run.period_month if run else None,
            "period_year": run.period_year if run else None,
            "status": run.status if run else None,
        } if run else None,
        "company": {
            "name": company.name if company else None,
            "legal_name": company.legal_name if company and hasattr(company, "legal_name") else None,
            "email": company.email if company and hasattr(company, "email") else None,
            "phone": company.phone if company and hasattr(company, "phone") else None,
            "address": company.address if company and hasattr(company, "address") else None,
            "city": company.city if company and hasattr(company, "city") else None,
            "country": company.country if company and hasattr(company, "country") else None,
            "logo_url": company.logo_url if company and hasattr(company, "logo_url") else None,
        } if company else None,
    }
