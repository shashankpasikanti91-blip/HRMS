"""LOP (Loss of Pay) API routes.

Endpoints:
  GET    /lop/policy                           — get company LOP policy
  PUT    /lop/policy                           — upsert company LOP policy

  GET    /lop/records                          — list LOP records (month/year/employee filters)
  POST   /lop/records/calculate               — calculate + save LOP for employee-month
  GET    /lop/records/{business_id}           — get single record
  POST   /lop/records/{business_id}/approve   — approve a LOP record
  POST   /lop/records/bulk-calculate          — calculate all employees for a month

  GET    /lop/overrides                        — list overrides
  POST   /lop/overrides                        — create override
  GET    /lop/overrides/{business_id}         — get single override
  POST   /lop/overrides/{business_id}/approve — approve override
"""

from __future__ import annotations

from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_hr_or_above
from app.core.pagination import PaginationParams, Page
from app.models.employee import Employee
from app.models.lop import LOPRecord, LOPOverride
from app.models.user import User
from app.schemas.lop import (
    LOPPolicyUpdate, LOPPolicyResponse,
    LOPRecordResponse,
    LOPOverrideCreate, LOPOverrideResponse,
)
from app.services.lop_service import (
    LOPPolicyService,
    LOPRecordService,
    LOPOverrideService,
)

router = APIRouter(prefix="/lop", tags=["LOP"])


# ─── Helper: enrich record with employee name + code ────────────────────────

async def _enrich_record(record: LOPRecord, db: AsyncSession) -> LOPRecordResponse:
    emp_result = await db.execute(
        select(Employee.full_name, Employee.employee_code).where(Employee.id == record.employee_id)
    )
    row = emp_result.first()
    resp = LOPRecordResponse.model_validate(record)
    if row:
        resp.employee_name = row[0]
        resp.employee_code = row[1]
    return resp


async def _enrich_override(override: LOPOverride, db: AsyncSession) -> LOPOverrideResponse:
    emp_result = await db.execute(
        select(Employee.full_name).where(Employee.id == override.employee_id)
    )
    row = emp_result.first()
    resp = LOPOverrideResponse.model_validate(override)
    if row:
        resp.employee_name = row[0]
    return resp


# ─── Policy endpoints ────────────────────────────────────────────────────────

@router.get("/policy", response_model=LOPPolicyResponse)
async def get_lop_policy(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = LOPPolicyService(db)
    policy = await svc.get_or_create_default(current_user.company_id, current_user.id)
    return LOPPolicyResponse.model_validate(policy)


@router.put("/policy", response_model=LOPPolicyResponse)
async def update_lop_policy(
    data: LOPPolicyUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    svc = LOPPolicyService(db)
    policy = await svc.update(current_user.company_id, data.model_dump(exclude_none=True), current_user.id)
    return LOPPolicyResponse.model_validate(policy)


# ─── Record endpoints ─────────────────────────────────────────────────────────

@router.get("/records", response_model=Page[LOPRecordResponse])
async def list_lop_records(
    params: PaginationParams = Depends(),
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    employee_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = LOPRecordService(db)
    records, total = await svc.list(
        current_user.company_id, params,
        year=year, month=month, employee_id=employee_id, status=status,
    )
    enriched = [await _enrich_record(r, db) for r in records]
    return Page.create(enriched, total, params)


@router.post("/records/calculate", response_model=LOPRecordResponse, status_code=201)
async def calculate_lop_for_employee(
    employee_business_id: str = Query(...),
    year: int = Query(...),
    month: int = Query(..., ge=1, le=12),
    recalculate: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    """Calculate and save LOP record for a specific employee-month."""
    emp_result = await db.execute(
        select(Employee).where(
            Employee.business_id == employee_business_id,
            Employee.company_id == current_user.company_id,
            Employee.is_deleted == False,
        )
    )
    emp = emp_result.scalar_one_or_none()
    if not emp:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("Employee not found")

    svc = LOPRecordService(db)
    record = await svc.get_or_calculate(
        current_user.company_id, emp.id, year, month, current_user.id, recalculate=recalculate
    )
    return await _enrich_record(record, db)


@router.post("/records/bulk-calculate", response_model=list[LOPRecordResponse], status_code=201)
async def bulk_calculate_lop(
    year: int = Query(...),
    month: int = Query(..., ge=1, le=12),
    recalculate: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    """Calculate LOP for ALL active employees for a given month."""
    emp_result = await db.execute(
        select(Employee).where(
            Employee.company_id == current_user.company_id,
            Employee.employment_status == "active",
            Employee.is_deleted == False,
        )
    )
    employees = emp_result.scalars().all()

    svc = LOPRecordService(db)
    records = []
    for emp in employees:
        record = await svc.get_or_calculate(
            current_user.company_id, emp.id, year, month, current_user.id, recalculate=recalculate
        )
        records.append(await _enrich_record(record, db))

    return records


@router.get("/records/{business_id}", response_model=LOPRecordResponse)
async def get_lop_record(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = LOPRecordService(db)
    record = await svc.get(business_id, current_user.company_id)
    return await _enrich_record(record, db)


@router.post("/records/{business_id}/approve", response_model=LOPRecordResponse)
async def approve_lop_record(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    svc = LOPRecordService(db)
    record = await svc.approve(business_id, current_user.company_id, current_user.id)
    return await _enrich_record(record, db)


# ─── Override endpoints ───────────────────────────────────────────────────────

@router.get("/overrides", response_model=Page[LOPOverrideResponse])
async def list_lop_overrides(
    params: PaginationParams = Depends(),
    employee_id: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = LOPOverrideService(db)
    overrides, total = await svc.list(
        current_user.company_id, params,
        employee_id=employee_id, year=year, month=month,
    )
    enriched = [await _enrich_override(o, db) for o in overrides]
    return Page.create(enriched, total, params)


@router.post("/overrides", response_model=LOPOverrideResponse, status_code=201)
async def create_lop_override(
    data: LOPOverrideCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    svc = LOPOverrideService(db)
    override = await svc.create(
        company_id=current_user.company_id,
        employee_id=data.employee_id,
        year=data.year,
        month=data.month,
        original_lop_days=data.original_lop_days,
        adjusted_lop_days=data.adjusted_lop_days,
        reason=data.reason,
        created_by=current_user.id,
    )
    return await _enrich_override(override, db)


@router.get("/overrides/{business_id}", response_model=LOPOverrideResponse)
async def get_lop_override(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = LOPOverrideService(db)
    override = await svc.get(business_id, current_user.company_id)
    return await _enrich_override(override, db)


@router.post("/overrides/{business_id}/approve", response_model=LOPOverrideResponse)
async def approve_lop_override(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    svc = LOPOverrideService(db)
    override = await svc.approve(business_id, current_user.company_id, current_user.id)
    return await _enrich_override(override, db)
