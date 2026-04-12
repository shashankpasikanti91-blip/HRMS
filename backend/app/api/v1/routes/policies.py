"""API routes for leave policies, attendance policies, and country configs."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_hr_or_above, require_company_admin_or_above
from app.models.user import User
from app.schemas.policy import (
    LeavePolicyCreate, LeavePolicyUpdate, LeavePolicyResponse,
    LeaveTypeCreate, LeaveTypeUpdate, LeaveTypeResponse,
    LeaveBalanceResponse,
    AttendancePolicyUpdate, AttendancePolicyResponse,
    CountryConfigResponse,
)
from app.schemas.base import MessageResponse
from app.services.policy_service import (
    LeavePolicyService, LeaveTypeService, LeaveBalanceService,
    AttendancePolicyService, CountryConfigService,
)

router = APIRouter(tags=["Policies"])


# ── Leave Policies ────────────────────────────────────────────────────────

@router.post("/leave-policies", response_model=LeavePolicyResponse, status_code=201)
async def create_leave_policy(
    data: LeavePolicyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    if not current_user.company_id:
        raise HTTPException(400, "No company associated")
    policy = await LeavePolicyService.create(db, current_user.company_id, data.model_dump(exclude_unset=True))
    await db.commit()
    return LeavePolicyResponse(
        business_id=policy.business_id, name=policy.name,
        description=policy.description, is_default=policy.is_default,
        is_active=policy.is_active,
    )


@router.get("/leave-policies")
async def list_leave_policies(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.company_id:
        raise HTTPException(400, "No company associated")
    policies = await LeavePolicyService.list(db, current_user.company_id)
    return {
        "items": [
            LeavePolicyResponse(
                business_id=p.business_id, name=p.name,
                description=p.description, is_default=p.is_default,
                is_active=p.is_active,
            )
            for p in policies
        ],
        "total": len(policies),
    }


@router.put("/leave-policies/{business_id}", response_model=LeavePolicyResponse)
async def update_leave_policy(
    business_id: str,
    data: LeavePolicyUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    if not current_user.company_id:
        raise HTTPException(400, "No company associated")
    policy = await LeavePolicyService.update(
        db, current_user.company_id, business_id, data.model_dump(exclude_unset=True)
    )
    if not policy:
        raise HTTPException(404, "Leave policy not found")
    await db.commit()
    return LeavePolicyResponse(
        business_id=policy.business_id, name=policy.name,
        description=policy.description, is_default=policy.is_default,
        is_active=policy.is_active,
    )


# ── Leave Types ───────────────────────────────────────────────────────────

@router.post("/leave-types", response_model=LeaveTypeResponse, status_code=201)
async def create_leave_type(
    data: LeaveTypeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    if not current_user.company_id:
        raise HTTPException(400, "No company associated")
    lt = await LeaveTypeService.create(db, current_user.company_id, data.model_dump(exclude_unset=True))
    await db.commit()
    return LeaveTypeResponse(
        business_id=lt.business_id, leave_policy_id=lt.leave_policy_id,
        name=lt.name, code=lt.code, annual_quota=lt.annual_quota,
        max_consecutive_days=lt.max_consecutive_days, min_days_per_request=lt.min_days_per_request,
        is_paid=lt.is_paid, is_carry_forward=lt.is_carry_forward,
        max_carry_forward=lt.max_carry_forward, accrual_frequency=lt.accrual_frequency,
        requires_approval=lt.requires_approval, requires_attachment=lt.requires_attachment,
        applicable_gender=lt.applicable_gender, probation_eligible=lt.probation_eligible,
        encashable=lt.encashable, color=lt.color, is_active=lt.is_active,
    )


@router.get("/leave-types")
async def list_leave_types(
    leave_policy_id: str = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.company_id:
        raise HTTPException(400, "No company associated")
    if leave_policy_id:
        types = await LeaveTypeService.list_by_policy(db, current_user.company_id, leave_policy_id)
    else:
        types = await LeaveTypeService.list_by_company(db, current_user.company_id)
    return {
        "items": [
            LeaveTypeResponse(
                business_id=lt.business_id, leave_policy_id=lt.leave_policy_id,
                name=lt.name, code=lt.code, annual_quota=lt.annual_quota,
                max_consecutive_days=lt.max_consecutive_days,
                min_days_per_request=lt.min_days_per_request,
                is_paid=lt.is_paid, is_carry_forward=lt.is_carry_forward,
                max_carry_forward=lt.max_carry_forward,
                accrual_frequency=lt.accrual_frequency,
                requires_approval=lt.requires_approval,
                requires_attachment=lt.requires_attachment,
                applicable_gender=lt.applicable_gender,
                probation_eligible=lt.probation_eligible,
                encashable=lt.encashable, color=lt.color, is_active=lt.is_active,
            )
            for lt in types
        ],
        "total": len(types),
    }


@router.put("/leave-types/{business_id}", response_model=LeaveTypeResponse)
async def update_leave_type(
    business_id: str,
    data: LeaveTypeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    if not current_user.company_id:
        raise HTTPException(400, "No company associated")
    lt = await LeaveTypeService.update(
        db, current_user.company_id, business_id, data.model_dump(exclude_unset=True)
    )
    if not lt:
        raise HTTPException(404, "Leave type not found")
    await db.commit()
    return LeaveTypeResponse(
        business_id=lt.business_id, leave_policy_id=lt.leave_policy_id,
        name=lt.name, code=lt.code, annual_quota=lt.annual_quota,
        max_consecutive_days=lt.max_consecutive_days,
        min_days_per_request=lt.min_days_per_request,
        is_paid=lt.is_paid, is_carry_forward=lt.is_carry_forward,
        max_carry_forward=lt.max_carry_forward,
        accrual_frequency=lt.accrual_frequency,
        requires_approval=lt.requires_approval,
        requires_attachment=lt.requires_attachment,
        applicable_gender=lt.applicable_gender,
        probation_eligible=lt.probation_eligible,
        encashable=lt.encashable, color=lt.color, is_active=lt.is_active,
    )


# ── Leave Balances ────────────────────────────────────────────────────────

@router.get("/leave-balances/{employee_business_id}")
async def get_employee_leave_balances(
    employee_business_id: str,
    year: int = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.company_id:
        raise HTTPException(400, "No company associated")

    # Resolve employee id from business_id
    from app.models.employee import Employee
    from sqlalchemy import select
    result = await db.execute(
        select(Employee).where(
            Employee.business_id == employee_business_id,
            Employee.company_id == current_user.company_id,
            Employee.is_deleted == False,
        )
    )
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(404, "Employee not found")

    balances = await LeaveBalanceService.get_employee_balances(
        db, current_user.company_id, employee.id, year
    )
    return {"items": balances, "total": len(balances)}


@router.post("/leave-balances/{employee_business_id}/allocate")
async def allocate_leave_balances(
    employee_business_id: str,
    year: int = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    if not current_user.company_id:
        raise HTTPException(400, "No company associated")

    from app.models.employee import Employee
    from sqlalchemy import select
    result = await db.execute(
        select(Employee).where(
            Employee.business_id == employee_business_id,
            Employee.company_id == current_user.company_id,
            Employee.is_deleted == False,
        )
    )
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(404, "Employee not found")

    await LeaveBalanceService.allocate_for_employee(db, current_user.company_id, employee.id, year)
    await db.commit()
    balances = await LeaveBalanceService.get_employee_balances(
        db, current_user.company_id, employee.id, year
    )
    return {"items": balances, "total": len(balances), "message": "Leave balances allocated"}


# ── Attendance Policy ─────────────────────────────────────────────────────

@router.get("/attendance-policy", response_model=AttendancePolicyResponse)
async def get_attendance_policy(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.company_id:
        raise HTTPException(400, "No company associated")
    policy = await AttendancePolicyService.get_or_create(db, current_user.company_id)
    await db.commit()
    return AttendancePolicyResponse(
        business_id=policy.business_id, company_id=policy.company_id,
        name=policy.name, check_in_required=policy.check_in_required,
        auto_checkout=policy.auto_checkout, auto_checkout_time=policy.auto_checkout_time,
        allow_manual_entry=policy.allow_manual_entry,
        require_approval_for_corrections=policy.require_approval_for_corrections,
        track_breaks=policy.track_breaks, max_break_minutes=policy.max_break_minutes,
        grace_period_minutes=policy.grace_period_minutes,
        half_day_hours=policy.half_day_hours,
        min_hours_for_full_day=policy.min_hours_for_full_day,
        enable_geo_fencing=policy.enable_geo_fencing,
        geo_fence_radius_meters=policy.geo_fence_radius_meters,
        allowed_check_in_methods=policy.allowed_check_in_methods,
    )


@router.put("/attendance-policy", response_model=AttendancePolicyResponse)
async def update_attendance_policy(
    data: AttendancePolicyUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_company_admin_or_above()),
):
    if not current_user.company_id:
        raise HTTPException(400, "No company associated")
    policy = await AttendancePolicyService.update(
        db, current_user.company_id, data.model_dump(exclude_unset=True)
    )
    await db.commit()
    return AttendancePolicyResponse(
        business_id=policy.business_id, company_id=policy.company_id,
        name=policy.name, check_in_required=policy.check_in_required,
        auto_checkout=policy.auto_checkout, auto_checkout_time=policy.auto_checkout_time,
        allow_manual_entry=policy.allow_manual_entry,
        require_approval_for_corrections=policy.require_approval_for_corrections,
        track_breaks=policy.track_breaks, max_break_minutes=policy.max_break_minutes,
        grace_period_minutes=policy.grace_period_minutes,
        half_day_hours=policy.half_day_hours,
        min_hours_for_full_day=policy.min_hours_for_full_day,
        enable_geo_fencing=policy.enable_geo_fencing,
        geo_fence_radius_meters=policy.geo_fence_radius_meters,
        allowed_check_in_methods=policy.allowed_check_in_methods,
    )


# ── Country Configs ───────────────────────────────────────────────────────

@router.get("/country-configs")
async def list_country_configs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    configs = await CountryConfigService.list_all(db)
    return {
        "items": [
            CountryConfigResponse(
                business_id=c.business_id, country_code=c.country_code,
                country_name=c.country_name, currency_code=c.currency_code,
                currency_symbol=c.currency_symbol, date_format=c.date_format,
                timezone=c.timezone, default_weekend_days=c.default_weekend_days,
                default_work_hours=c.default_work_hours,
                minimum_wage=c.minimum_wage,
            )
            for c in configs
        ],
        "total": len(configs),
    }
