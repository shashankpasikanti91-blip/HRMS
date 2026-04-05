from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from app.schemas.base import BaseSchema, BaseResponse
from app.utils.enums import AttendanceStatus, CheckInMethod, LeaveType, LeaveStatus


# ── Attendance ─────────────────────────────────────────────────────────────

class CheckInRequest(BaseSchema):
    employee_id: Optional[str] = None  # HR/admin override, else uses current user
    check_in_method: Optional[CheckInMethod] = CheckInMethod.WEB
    check_in_location: Optional[str] = None
    remarks: Optional[str] = None


class CheckOutRequest(BaseSchema):
    employee_id: Optional[str] = None
    check_out_method: Optional[CheckInMethod] = CheckInMethod.WEB
    check_out_location: Optional[str] = None
    remarks: Optional[str] = None


class ManualAttendanceEntry(BaseSchema):
    employee_id: str
    attendance_date: date
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    status: AttendanceStatus
    remarks: Optional[str] = None


class AttendanceApproveRequest(BaseSchema):
    remarks: Optional[str] = None


class AttendanceResponse(BaseResponse):
    company_id: str
    employee_id: str
    employee_name: Optional[str] = None
    employee_code: Optional[str] = None
    attendance_date: date
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    total_hours: Optional[float] = None
    overtime_hours: Optional[float] = None
    late_minutes: Optional[int] = None
    status: str
    check_in_method: Optional[str] = None
    check_out_method: Optional[str] = None
    check_in_location: Optional[str] = None
    check_out_location: Optional[str] = None
    remarks: Optional[str] = None
    is_approved: bool = False


# ── Leave ──────────────────────────────────────────────────────────────────

class LeaveRequestCreate(BaseSchema):
    leave_type: LeaveType
    start_date: date
    end_date: date
    reason: Optional[str] = None


class LeaveRequestApprove(BaseSchema):
    remarks: Optional[str] = None


class LeaveRequestReject(BaseSchema):
    rejection_reason: str


class LeaveResponse(BaseResponse):
    company_id: str
    employee_id: str
    employee_name: Optional[str] = None
    employee_code: Optional[str] = None
    leave_type: str
    start_date: date
    end_date: date
    total_days: Optional[float] = None
    reason: Optional[str] = None
    status: str
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
