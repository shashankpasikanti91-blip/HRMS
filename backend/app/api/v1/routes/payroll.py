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
    return Page.create([PayrollItemResponse.model_validate(i) for i in items], total, params)
