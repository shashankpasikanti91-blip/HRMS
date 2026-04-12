from __future__ import annotations

from datetime import date, datetime, timezone
from typing import List, Optional, Tuple

from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException, ConflictException, BadRequestException, ForbiddenException
from app.core.pagination import PaginationParams
from app.models.attendance import Attendance, LeaveRequest
from app.models.employee import Employee
from app.repositories.base import BaseRepository
from app.schemas.attendance import (
    CheckInRequest,
    CheckOutRequest,
    ManualAttendanceEntry,
    LeaveRequestCreate,
    LeaveRequestApprove,
    LeaveRequestReject,
)
from app.services.business_id_service import BusinessIdService
from app.utils.enums import AttendanceStatus, UserRole
import uuid


class AttendanceService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = BaseRepository(Attendance, db)

    async def _resolve_employee(
        self,
        employee_id_override: Optional[str],
        current_user_id: str,
        company_id: str,
        role: str,
    ) -> Employee:
        """Resolve which employee to mark attendance for."""
        if employee_id_override:
            # Only HR/Admin can check in for others
            if role not in (
                UserRole.SUPER_ADMIN.value,
                UserRole.COMPANY_ADMIN.value,
                UserRole.HR_MANAGER.value,
            ):
                raise ForbiddenException("Only HR/Admin can record attendance for other employees")
            emp_result = await self.db.execute(
                select(Employee).where(
                    Employee.id == employee_id_override,
                    Employee.company_id == company_id,
                    Employee.is_deleted == False,
                )
            )
            emp = emp_result.scalar_one_or_none()
            if not emp:
                raise NotFoundException(f"Employee not found")
            return emp
        else:
            # Use logged-in employee
            emp_result = await self.db.execute(
                select(Employee).where(
                    Employee.user_id == current_user_id,
                    Employee.company_id == company_id,
                    Employee.is_deleted == False,
                )
            )
            emp = emp_result.scalar_one_or_none()
            if not emp:
                raise NotFoundException("Your employee profile was not found")
            return emp

    async def get_my_today(self, current_user_id: str, company_id: str) -> Optional[Attendance]:
        """Get today's attendance record for the current user. Returns None if no employee profile or no record."""
        emp_result = await self.db.execute(
            select(Employee).where(
                Employee.user_id == current_user_id,
                Employee.company_id == company_id,
                Employee.is_deleted == False,
            )
        )
        emp = emp_result.scalar_one_or_none()
        if not emp:
            return None
        today = date.today()
        att_result = await self.db.execute(
            select(Attendance).where(
                Attendance.employee_id == emp.id,
                Attendance.attendance_date == today,
            )
        )
        return att_result.scalar_one_or_none()

    async def check_in(
        self,
        data: CheckInRequest,
        current_user_id: str,
        company_id: str,
        role: str,
    ) -> Attendance:
        today = date.today()
        emp = await self._resolve_employee(
            data.employee_id, current_user_id, company_id, role
        )

        # Prevent duplicate check-in
        existing = await self.db.execute(
            select(Attendance).where(
                Attendance.employee_id == emp.id,
                Attendance.attendance_date == today,
            )
        )
        if existing.scalar_one_or_none():
            raise ConflictException(f"Attendance already recorded for today")

        bid = await BusinessIdService.generate(self.db, "attendance")
        now = datetime.now(tz=timezone.utc)
        att = Attendance(
            id=str(uuid.uuid4()),
            business_id=bid,
            company_id=company_id,
            employee_id=emp.id,
            attendance_date=today,
            check_in_time=now,
            status=AttendanceStatus.PRESENT.value,
            check_in_method=data.check_in_method.value if data.check_in_method else "web",
            check_in_location=data.check_in_location,
            remarks=data.remarks,
            created_by=current_user_id,
        )
        self.db.add(att)
        await self.db.flush()
        await self.db.refresh(att)
        return att

    async def check_out(
        self,
        data: CheckOutRequest,
        current_user_id: str,
        company_id: str,
        role: str,
    ) -> Attendance:
        today = date.today()
        emp = await self._resolve_employee(
            data.employee_id, current_user_id, company_id, role
        )

        att_result = await self.db.execute(
            select(Attendance).where(
                Attendance.employee_id == emp.id,
                Attendance.attendance_date == today,
            )
        )
        att = att_result.scalar_one_or_none()
        if not att:
            raise NotFoundException("No check-in found for today")
        if att.check_out_time:
            raise ConflictException("Already checked out for today")

        now = datetime.now(tz=timezone.utc)
        att.check_out_time = now
        att.check_out_method = data.check_out_method.value if data.check_out_method else "web"
        att.check_out_location = data.check_out_location
        if att.check_in_time:
            delta = now - att.check_in_time
            att.total_hours = round(delta.total_seconds() / 3600, 2)
        att.updated_by = current_user_id
        await self.db.flush()
        await self.db.refresh(att)
        return att

    async def manual_entry(
        self,
        data: ManualAttendanceEntry,
        company_id: str,
        created_by: str,
        role: str,
    ) -> Attendance:
        emp = await self._resolve_employee(data.employee_id, created_by, company_id, role)

        # Check for existing record
        existing = await self.db.execute(
            select(Attendance).where(
                Attendance.employee_id == emp.id,
                Attendance.attendance_date == data.attendance_date,
            )
        )
        existing_att = existing.scalar_one_or_none()
        if existing_att:
            # Update instead of create
            existing_att.check_in_time = data.check_in_time
            existing_att.check_out_time = data.check_out_time
            existing_att.status = data.status.value
            existing_att.remarks = data.remarks
            if data.check_in_time and data.check_out_time:
                delta = data.check_out_time - data.check_in_time
                existing_att.total_hours = round(delta.total_seconds() / 3600, 2)
            existing_att.updated_by = created_by
            await self.db.flush()
            await self.db.refresh(existing_att)
            return existing_att

        bid = await BusinessIdService.generate(self.db, "attendance")
        total_hours = None
        if data.check_in_time and data.check_out_time:
            delta = data.check_out_time - data.check_in_time
            total_hours = round(delta.total_seconds() / 3600, 2)

        att = Attendance(
            id=str(uuid.uuid4()),
            business_id=bid,
            company_id=company_id,
            employee_id=emp.id,
            attendance_date=data.attendance_date,
            check_in_time=data.check_in_time,
            check_out_time=data.check_out_time,
            total_hours=total_hours,
            status=data.status.value,
            check_in_method="manual",
            remarks=data.remarks,
            created_by=created_by,
        )
        self.db.add(att)
        await self.db.flush()
        await self.db.refresh(att)
        return att

    async def list(
        self,
        company_id: str,
        params: PaginationParams,
        employee_id: Optional[str] = None,
        attendance_date: Optional[date] = None,
        status: Optional[str] = None,
    ) -> Tuple[List[Attendance], int]:
        filters = {}
        if employee_id:
            filters["employee_id"] = employee_id
        if status:
            filters["status"] = status
        conditions = []
        if attendance_date:
            conditions.append(Attendance.attendance_date == attendance_date)
        return await self.repo.list(
            company_id=company_id,
            params=params,
            filters=filters,
            extra_conditions=conditions,
        )

    async def get(self, business_id: str, company_id: str) -> Attendance:
        return await self.repo.get_or_404(business_id, company_id)

    async def approve(self, business_id: str, company_id: str, approved_by: str) -> Attendance:
        att = await self.repo.get_or_404(business_id, company_id)
        att.is_approved = True
        att.approved_by = approved_by
        att.updated_by = approved_by
        await self.db.flush()
        await self.db.refresh(att)
        return att


class LeaveService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = BaseRepository(LeaveRequest, db)

    async def create(self, data: LeaveRequestCreate, employee_id: str, company_id: str, created_by: str) -> LeaveRequest:
        from app.utils.helpers import calculate_working_days
        total_days = calculate_working_days(data.start_date, data.end_date)

        bid = await BusinessIdService.generate(self.db, "leave_request")
        leave = LeaveRequest(
            id=str(uuid.uuid4()),
            business_id=bid,
            company_id=company_id,
            employee_id=employee_id,
            leave_type=data.leave_type.value,
            start_date=data.start_date,
            end_date=data.end_date,
            total_days=total_days,
            reason=data.reason,
            status="pending",
            created_by=created_by,
        )
        self.db.add(leave)
        await self.db.flush()
        await self.db.refresh(leave)
        return leave

    async def list(
        self,
        company_id: str,
        params: PaginationParams,
        employee_id: Optional[str] = None,
        status: Optional[str] = None,
    ) -> Tuple[List[LeaveRequest], int]:
        filters = {}
        if employee_id:
            filters["employee_id"] = employee_id
        if status:
            filters["status"] = status
        return await self.repo.list(company_id=company_id, params=params, filters=filters)

    async def get(self, business_id: str, company_id: str) -> LeaveRequest:
        return await self.repo.get_or_404(business_id, company_id)

    async def approve(self, business_id: str, company_id: str, approved_by: str) -> LeaveRequest:
        leave = await self.repo.get_or_404(business_id, company_id)
        if leave.status != "pending":
            raise BadRequestException(f"Leave request is already {leave.status}")
        leave.status = "approved"
        leave.approved_by = approved_by
        leave.approved_at = datetime.now(tz=timezone.utc)
        leave.updated_by = approved_by
        await self.db.flush()
        await self.db.refresh(leave)
        return leave

    async def reject(self, business_id: str, company_id: str, rejection_reason: str, rejected_by: str) -> LeaveRequest:
        leave = await self.repo.get_or_404(business_id, company_id)
        if leave.status != "pending":
            raise BadRequestException(f"Leave request is already {leave.status}")
        leave.status = "rejected"
        leave.rejection_reason = rejection_reason
        leave.updated_by = rejected_by
        await self.db.flush()
        await self.db.refresh(leave)
        return leave
