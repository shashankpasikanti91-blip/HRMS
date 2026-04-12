from __future__ import annotations

from typing import Optional
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_hr_or_above
from app.core.pagination import PaginationParams, Page
from app.models.user import User
from app.schemas.attendance import (
    CheckInRequest,
    CheckOutRequest,
    ManualAttendanceEntry,
    AttendanceApproveRequest,
    AttendanceResponse,
    LeaveRequestCreate,
    LeaveRequestApprove,
    LeaveRequestReject,
    LeaveResponse,
)
from app.services.attendance_service import AttendanceService, LeaveService

att_router = APIRouter(prefix="/attendance", tags=["Attendance"])
leave_router = APIRouter(prefix="/leaves", tags=["Leave Requests"])


# ── Helpers ────────────────────────────────────────────────────────────────

async def _enrich_attendance(att, db: AsyncSession) -> AttendanceResponse:
    """Convert Attendance model to response with employee name/code."""
    from sqlalchemy import select as sa_select
    from app.models.employee import Employee
    resp = AttendanceResponse.model_validate(att)
    emp_result = await db.execute(
        sa_select(Employee.first_name, Employee.last_name, Employee.employee_code).where(Employee.id == att.employee_id)
    )
    emp = emp_result.first()
    if emp:
        resp.employee_name = f"{emp.first_name or ''} {emp.last_name or ''}".strip() or None
        resp.employee_code = emp.employee_code
    return resp


# ── Attendance ─────────────────────────────────────────────────────────────

@att_router.get("/me/today")
async def get_my_today(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the current user's attendance record for today."""
    svc = AttendanceService(db)
    record = await svc.get_my_today(current_user.id, current_user.company_id)
    if not record:
        return None
    return await _enrich_attendance(record, db)


@att_router.post("/check-in", response_model=AttendanceResponse, status_code=201)
async def check_in(
    data: CheckInRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Employee check-in. HR/Admin can check in on behalf of employee."""
    svc = AttendanceService(db)
    att = await svc.check_in(data, current_user.id, current_user.company_id, current_user.role)
    return await _enrich_attendance(att, db)


@att_router.post("/check-out", response_model=AttendanceResponse)
async def check_out(
    data: CheckOutRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Employee check-out."""
    svc = AttendanceService(db)
    att = await svc.check_out(data, current_user.id, current_user.company_id, current_user.role)
    return await _enrich_attendance(att, db)


@att_router.post("/manual-entry", response_model=AttendanceResponse, status_code=201)
async def manual_attendance(
    data: ManualAttendanceEntry,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create or request an attendance correction for the current user or, for HR/Admin, another employee."""
    svc = AttendanceService(db)
    att = await svc.manual_entry(data, current_user.company_id, current_user.id, current_user.role)
    return await _enrich_attendance(att, db)


@att_router.get("", response_model=Page[AttendanceResponse])
async def list_attendance(
    params: PaginationParams = Depends(),
    employee_id: Optional[str] = Query(None),
    attendance_date: Optional[date] = Query(None),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = AttendanceService(db)
    records, total = await svc.list(
        current_user.company_id,
        params,
        employee_id=employee_id,
        attendance_date=attendance_date,
        status=status,
    )
    enriched = []
    for r in records:
        enriched.append(await _enrich_attendance(r, db))
    return Page.create(enriched, total, params)


@att_router.get("/{business_id}", response_model=AttendanceResponse)
async def get_attendance(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = AttendanceService(db)
    att = await svc.get(business_id, current_user.company_id)
    return await _enrich_attendance(att, db)


@att_router.get("/employee/{employee_business_id}", response_model=Page[AttendanceResponse])
async def get_employee_attendance(
    employee_business_id: str,
    params: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all attendance records for a specific employee."""
    from app.services.employee_service import EmployeeService
    emp_svc = EmployeeService(db)
    emp = await emp_svc.get(employee_business_id, current_user.company_id)
    svc = AttendanceService(db)
    records, total = await svc.list(current_user.company_id, params, employee_id=emp.id)
    enriched = [await _enrich_attendance(r, db) for r in records]
    return Page.create(enriched, total, params)


@att_router.put("/{business_id}/approve", response_model=AttendanceResponse)
async def approve_attendance(
    business_id: str,
    data: AttendanceApproveRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    """Approve an attendance record."""
    svc = AttendanceService(db)
    att = await svc.approve(business_id, current_user.company_id, current_user.id)
    return await _enrich_attendance(att, db)


# ── Leave Requests ──────────────────────────────────────────────────────────

@leave_router.post("", response_model=LeaveResponse, status_code=201)
async def create_leave_request(
    data: LeaveRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit a leave request."""
    from sqlalchemy import select
    from app.models.employee import Employee
    emp_result = await db.execute(
        select(Employee).where(
            Employee.user_id == current_user.id,
            Employee.company_id == current_user.company_id,
            Employee.is_deleted == False,
        )
    )
    emp = emp_result.scalar_one_or_none()
    if not emp:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("Employee profile not found for current user")
    svc = LeaveService(db)
    leave = await svc.create(data, emp.id, current_user.company_id, current_user.id)
    return LeaveResponse.model_validate(leave)


@leave_router.get("", response_model=Page[LeaveResponse])
async def list_leaves(
    params: PaginationParams = Depends(),
    employee_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = LeaveService(db)
    leaves, total = await svc.list(
        current_user.company_id, params, employee_id=employee_id, status=status
    )
    return Page.create([LeaveResponse.model_validate(l) for l in leaves], total, params)


@leave_router.get("/{business_id}", response_model=LeaveResponse)
async def get_leave(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = LeaveService(db)
    leave = await svc.get(business_id, current_user.company_id)
    return LeaveResponse.model_validate(leave)


@leave_router.put("/{business_id}/approve", response_model=LeaveResponse)
async def approve_leave(
    business_id: str,
    data: LeaveRequestApprove,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    svc = LeaveService(db)
    leave = await svc.approve(business_id, current_user.company_id, current_user.id)
    return LeaveResponse.model_validate(leave)


@leave_router.put("/{business_id}/reject", response_model=LeaveResponse)
async def reject_leave(
    business_id: str,
    data: LeaveRequestReject,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    svc = LeaveService(db)
    leave = await svc.reject(
        business_id, current_user.company_id, data.rejection_reason, current_user.id
    )
    return LeaveResponse.model_validate(leave)
