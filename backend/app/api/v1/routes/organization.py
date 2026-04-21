"""API routes for organization settings, branches, designations, and shifts."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_hr_or_above, require_company_admin_or_above
from app.models.user import User
from app.schemas.organization import (
    BranchCreate, BranchUpdate, BranchResponse,
    DesignationCreate, DesignationUpdate, DesignationResponse,
    OrganizationSettingsUpdate, OrganizationSettingsResponse,
)
from app.schemas.salary import ShiftCreate, ShiftUpdate, ShiftResponse
from app.schemas.base import MessageResponse
from app.services.organization_service import (
    OrganizationSettingsService, BranchService, DesignationService, ShiftService,
)

router = APIRouter(tags=["Organization"])

# ── Organization Settings ─────────────────────────────────────────────────

@router.get("/organization/settings", response_model=OrganizationSettingsResponse)
async def get_organization_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.company_id:
        raise HTTPException(400, "No company associated")
    settings = await OrganizationSettingsService.get_or_create(db, current_user.company_id)
    await db.commit()
    return OrganizationSettingsResponse(
        business_id=settings.business_id,
        company_id=settings.company_id,
        working_days=settings.working_days,
        weekend_days=settings.weekend_days,
        work_start_time=settings.work_start_time,
        work_end_time=settings.work_end_time,
        daily_work_hours=settings.daily_work_hours,
        weekly_work_hours=settings.weekly_work_hours,
        late_threshold_minutes=settings.late_threshold_minutes,
        overtime_threshold_hours=settings.overtime_threshold_hours,
        overtime_multiplier=settings.overtime_multiplier,
        payroll_cycle=settings.payroll_cycle,
        payroll_process_day=settings.payroll_process_day,
        default_currency=settings.default_currency,
        probation_period_days=settings.probation_period_days,
        notice_period_days=settings.notice_period_days,
        date_format=settings.date_format,
        time_format=settings.time_format,
        password_min_length=settings.password_min_length,
        password_require_uppercase=settings.password_require_uppercase,
        password_require_number=settings.password_require_number,
        password_require_special=settings.password_require_special,
        password_expiry_days=settings.password_expiry_days,
        enable_overtime=settings.enable_overtime,
        enable_shifts=settings.enable_shifts,
        enable_geo_tracking=settings.enable_geo_tracking,
        enable_client_billing=settings.enable_client_billing,
        enable_telegram_bot=settings.enable_telegram_bot,
        custom_config=settings.custom_config,
    )


@router.put("/organization/settings", response_model=OrganizationSettingsResponse)
async def update_organization_settings(
    data: OrganizationSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_company_admin_or_above()),
):
    if not current_user.company_id:
        raise HTTPException(400, "No company associated")
    settings = await OrganizationSettingsService.update(
        db, current_user.company_id, data.model_dump(exclude_unset=True)
    )
    await db.commit()
    return OrganizationSettingsResponse(
        business_id=settings.business_id,
        company_id=settings.company_id,
        working_days=settings.working_days,
        weekend_days=settings.weekend_days,
        work_start_time=settings.work_start_time,
        work_end_time=settings.work_end_time,
        daily_work_hours=settings.daily_work_hours,
        weekly_work_hours=settings.weekly_work_hours,
        late_threshold_minutes=settings.late_threshold_minutes,
        overtime_threshold_hours=settings.overtime_threshold_hours,
        overtime_multiplier=settings.overtime_multiplier,
        payroll_cycle=settings.payroll_cycle,
        payroll_process_day=settings.payroll_process_day,
        default_currency=settings.default_currency,
        probation_period_days=settings.probation_period_days,
        notice_period_days=settings.notice_period_days,
        date_format=settings.date_format,
        time_format=settings.time_format,
        password_min_length=settings.password_min_length,
        password_require_uppercase=settings.password_require_uppercase,
        password_require_number=settings.password_require_number,
        password_require_special=settings.password_require_special,
        password_expiry_days=settings.password_expiry_days,
        enable_overtime=settings.enable_overtime,
        enable_shifts=settings.enable_shifts,
        enable_geo_tracking=settings.enable_geo_tracking,
        enable_client_billing=settings.enable_client_billing,
        enable_telegram_bot=settings.enable_telegram_bot,
        custom_config=settings.custom_config,
    )


@router.patch("/organization/settings", response_model=OrganizationSettingsResponse)
async def patch_organization_settings(
    data: OrganizationSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_company_admin_or_above()),
):
    """Partial update — only provided fields are changed."""
    if not current_user.company_id:
        raise HTTPException(400, "No company associated")
    settings = await OrganizationSettingsService.update(
        db, current_user.company_id, data.model_dump(exclude_unset=True)
    )
    await db.commit()
    return OrganizationSettingsResponse(
        business_id=settings.business_id,
        company_id=settings.company_id,
        working_days=settings.working_days,
        weekend_days=settings.weekend_days,
        work_start_time=settings.work_start_time,
        work_end_time=settings.work_end_time,
        daily_work_hours=settings.daily_work_hours,
        weekly_work_hours=settings.weekly_work_hours,
        late_threshold_minutes=settings.late_threshold_minutes,
        overtime_threshold_hours=settings.overtime_threshold_hours,
        overtime_multiplier=settings.overtime_multiplier,
        payroll_cycle=settings.payroll_cycle,
        payroll_process_day=settings.payroll_process_day,
        default_currency=settings.default_currency,
        probation_period_days=settings.probation_period_days,
        notice_period_days=settings.notice_period_days,
        date_format=settings.date_format,
        time_format=settings.time_format,
        password_min_length=settings.password_min_length,
        password_require_uppercase=settings.password_require_uppercase,
        password_require_number=settings.password_require_number,
        password_require_special=settings.password_require_special,
        password_expiry_days=settings.password_expiry_days,
        enable_overtime=settings.enable_overtime,
        enable_shifts=settings.enable_shifts,
        enable_geo_tracking=settings.enable_geo_tracking,
        enable_client_billing=settings.enable_client_billing,
        enable_telegram_bot=settings.enable_telegram_bot,
        custom_config=settings.custom_config,
    )


# ── Branches ──────────────────────────────────────────────────────────────

@router.post("/branches", response_model=BranchResponse, status_code=201)
async def create_branch(
    data: BranchCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    if not current_user.company_id:
        raise HTTPException(400, "No company associated")
    branch = await BranchService.create(db, current_user.company_id, data.model_dump(exclude_unset=True))
    await db.commit()
    return BranchResponse(
        business_id=branch.business_id, name=branch.name, code=branch.code,
        branch_type=branch.branch_type, address=branch.address, city=branch.city,
        state=branch.state, country=branch.country, timezone=branch.timezone,
        phone=branch.phone, email=branch.email, manager_id=branch.manager_id,
        employee_count=branch.employee_count, is_active=branch.is_active,
        created_at=str(branch.created_at) if branch.created_at else None,
    )


@router.get("/branches")
async def list_branches(
    q: str = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.company_id:
        raise HTTPException(400, "No company associated")
    branches, total = await BranchService.list(db, current_user.company_id, q, page, page_size)
    return {
        "items": [
            BranchResponse(
                business_id=b.business_id, name=b.name, code=b.code,
                branch_type=b.branch_type, address=b.address, city=b.city,
                state=b.state, country=b.country, timezone=b.timezone,
                phone=b.phone, email=b.email, manager_id=b.manager_id,
                employee_count=b.employee_count, is_active=b.is_active,
            )
            for b in branches
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/branches/{business_id}", response_model=BranchResponse)
async def get_branch(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.company_id:
        raise HTTPException(400, "No company associated")
    branch = await BranchService.get(db, current_user.company_id, business_id)
    if not branch:
        raise HTTPException(404, "Branch not found")
    return BranchResponse(
        business_id=branch.business_id, name=branch.name, code=branch.code,
        branch_type=branch.branch_type, address=branch.address, city=branch.city,
        state=branch.state, country=branch.country, timezone=branch.timezone,
        phone=branch.phone, email=branch.email, manager_id=branch.manager_id,
        employee_count=branch.employee_count, is_active=branch.is_active,
    )


@router.put("/branches/{business_id}", response_model=BranchResponse)
async def update_branch(
    business_id: str,
    data: BranchUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    if not current_user.company_id:
        raise HTTPException(400, "No company associated")
    branch = await BranchService.update(db, current_user.company_id, business_id, data.model_dump(exclude_unset=True))
    if not branch:
        raise HTTPException(404, "Branch not found")
    await db.commit()
    return BranchResponse(
        business_id=branch.business_id, name=branch.name, code=branch.code,
        branch_type=branch.branch_type, address=branch.address, city=branch.city,
        state=branch.state, country=branch.country, timezone=branch.timezone,
        phone=branch.phone, email=branch.email, manager_id=branch.manager_id,
        employee_count=branch.employee_count, is_active=branch.is_active,
    )


@router.delete("/branches/{business_id}", response_model=MessageResponse)
async def delete_branch(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    if not current_user.company_id:
        raise HTTPException(400, "No company associated")
    deleted = await BranchService.delete(db, current_user.company_id, business_id)
    if not deleted:
        raise HTTPException(404, "Branch not found")
    await db.commit()
    return MessageResponse(message="Branch deleted successfully")


# ── Designations ──────────────────────────────────────────────────────────

@router.post("/designations", response_model=DesignationResponse, status_code=201)
async def create_designation(
    data: DesignationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    if not current_user.company_id:
        raise HTTPException(400, "No company associated")
    d = await DesignationService.create(db, current_user.company_id, data.model_dump(exclude_unset=True))
    await db.commit()
    return DesignationResponse(
        business_id=d.business_id, name=d.name, code=d.code,
        level=d.level, description=d.description, is_active=d.is_active,
    )


@router.get("/designations")
async def list_designations(
    q: str = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.company_id:
        raise HTTPException(400, "No company associated")
    items, total = await DesignationService.list(db, current_user.company_id, q, page, page_size)
    return {
        "items": [
            DesignationResponse(
                business_id=d.business_id, name=d.name, code=d.code,
                level=d.level, description=d.description, is_active=d.is_active,
            )
            for d in items
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.put("/designations/{business_id}", response_model=DesignationResponse)
async def update_designation(
    business_id: str,
    data: DesignationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    if not current_user.company_id:
        raise HTTPException(400, "No company associated")
    d = await DesignationService.update(db, current_user.company_id, business_id, data.model_dump(exclude_unset=True))
    if not d:
        raise HTTPException(404, "Designation not found")
    await db.commit()
    return DesignationResponse(
        business_id=d.business_id, name=d.name, code=d.code,
        level=d.level, description=d.description, is_active=d.is_active,
    )


@router.delete("/designations/{business_id}", response_model=MessageResponse)
async def delete_designation(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    if not current_user.company_id:
        raise HTTPException(400, "No company associated")
    deleted = await DesignationService.delete(db, current_user.company_id, business_id)
    if not deleted:
        raise HTTPException(404, "Designation not found")
    await db.commit()
    return MessageResponse(message="Designation deleted successfully")


# ── Shifts ────────────────────────────────────────────────────────────────

@router.post("/shifts", response_model=ShiftResponse, status_code=201)
async def create_shift(
    data: ShiftCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    if not current_user.company_id:
        raise HTTPException(400, "No company associated")
    shift = await ShiftService.create(db, current_user.company_id, data.model_dump(exclude_unset=True))
    await db.commit()
    return ShiftResponse(
        business_id=shift.business_id, name=shift.name, code=shift.code,
        shift_type=shift.shift_type, start_time=shift.start_time, end_time=shift.end_time,
        break_duration_minutes=shift.break_duration_minutes, work_hours=shift.work_hours,
        is_night_shift=shift.is_night_shift, grace_minutes=shift.grace_minutes,
        is_default=shift.is_default, applicable_days=shift.applicable_days,
        is_active=shift.is_active,
    )


@router.get("/shifts")
async def list_shifts(
    q: str = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.company_id:
        raise HTTPException(400, "No company associated")
    items, total = await ShiftService.list(db, current_user.company_id, q, page, page_size)
    return {
        "items": [
            ShiftResponse(
                business_id=s.business_id, name=s.name, code=s.code,
                shift_type=s.shift_type, start_time=s.start_time, end_time=s.end_time,
                break_duration_minutes=s.break_duration_minutes, work_hours=s.work_hours,
                is_night_shift=s.is_night_shift, grace_minutes=s.grace_minutes,
                is_default=s.is_default, applicable_days=s.applicable_days,
                is_active=s.is_active,
            )
            for s in items
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.put("/shifts/{business_id}", response_model=ShiftResponse)
async def update_shift(
    business_id: str,
    data: ShiftUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    if not current_user.company_id:
        raise HTTPException(400, "No company associated")
    shift = await ShiftService.update(db, current_user.company_id, business_id, data.model_dump(exclude_unset=True))
    if not shift:
        raise HTTPException(404, "Shift not found")
    await db.commit()
    return ShiftResponse(
        business_id=shift.business_id, name=shift.name, code=shift.code,
        shift_type=shift.shift_type, start_time=shift.start_time, end_time=shift.end_time,
        break_duration_minutes=shift.break_duration_minutes, work_hours=shift.work_hours,
        is_night_shift=shift.is_night_shift, grace_minutes=shift.grace_minutes,
        is_default=shift.is_default, applicable_days=shift.applicable_days,
        is_active=shift.is_active,
    )


@router.delete("/shifts/{business_id}", response_model=MessageResponse)
async def delete_shift(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    if not current_user.company_id:
        raise HTTPException(400, "No company associated")
    deleted = await ShiftService.delete(db, current_user.company_id, business_id)
    if not deleted:
        raise HTTPException(404, "Shift not found")
    await db.commit()
    return MessageResponse(message="Shift deleted successfully")
