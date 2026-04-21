"""LOP (Loss of Pay) service.

Provides:
  1. LOPPolicyService - CRUD for company LOP policy
  2. LOPCalculationService - calculates LOP for an employee-month from attendance data
  3. LOPRecordService - CRUD for LOP records + approval flow
  4. LOPOverrideService - CRUD for HR overrides
"""

from __future__ import annotations

import calendar
import uuid
from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional, Tuple

from sqlalchemy import select, and_, extract, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException, ConflictException, BadRequestException
from app.core.pagination import PaginationParams, Page
from app.models.attendance import Attendance, LeaveRequest, Holiday
from app.models.employee import Employee
from app.models.lop import LOPPolicy, LOPRecord, LOPOverride
from app.services.business_id_service import BusinessIdService


# ─── Policy Service ──────────────────────────────────────────────────────────


class LOPPolicyService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get(self, company_id: str) -> LOPPolicy:
        result = await self.db.execute(
            select(LOPPolicy).where(
                LOPPolicy.company_id == company_id,
                LOPPolicy.is_deleted == False,
            )
        )
        policy = result.scalar_one_or_none()
        if not policy:
            raise NotFoundException("LOP policy not configured for this company")
        return policy

    async def get_or_create_default(self, company_id: str, created_by: str) -> LOPPolicy:
        """Return existing policy or create a default one."""
        try:
            return await self.get(company_id)
        except NotFoundException:
            bid = await BusinessIdService.generate(self.db, "lop_policy")
            policy = LOPPolicy(
                id=str(uuid.uuid4()),
                business_id=bid,
                company_id=company_id,
                created_by=created_by,
            )
            self.db.add(policy)
            await self.db.flush()
            await self.db.refresh(policy)
            return policy

    async def update(self, company_id: str, data: dict, updated_by: str) -> LOPPolicy:
        policy = await self.get_or_create_default(company_id, updated_by)
        for key, val in data.items():
            if val is not None and hasattr(policy, key):
                setattr(policy, key, val)
        policy.updated_by = updated_by
        await self.db.flush()
        await self.db.refresh(policy)
        return policy


# ─── Calculation Service ─────────────────────────────────────────────────────


class LOPCalculationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _get_working_days_in_month(self, company_id: str, year: int, month: int) -> int:
        """Count working days (Mon-Fri) minus public holidays for the month."""
        _, last_day = calendar.monthrange(year, month)
        month_start = date(year, month, 1)
        month_end = date(year, month, last_day)

        # Count weekday (Mon-Fri) days in month
        working_days = sum(
            1 for d in range(1, last_day + 1)
            if date(year, month, d).weekday() < 5  # 0=Mon … 4=Fri
        )

        # Subtract public holidays that fall on weekdays
        holidays_result = await self.db.execute(
            select(func.count()).where(
                Holiday.company_id == company_id,
                Holiday.date >= month_start,
                Holiday.date <= month_end,
                Holiday.holiday_type == "public",
                Holiday.is_deleted == False,
            )
        )
        holiday_count = holidays_result.scalar() or 0
        return max(0, working_days - holiday_count)

    async def calculate(
        self,
        company_id: str,
        employee_id: str,
        year: int,
        month: int,
        policy: LOPPolicy,
    ) -> dict:
        """
        Returns a dict with all LOP inputs and computed values.
        Does NOT write to DB.
        """
        _, last_day = calendar.monthrange(year, month)
        month_start = date(year, month, 1)
        month_end = date(year, month, last_day)

        total_working_days = await self._get_working_days_in_month(company_id, year, month)

        # Attendance records for this employee this month
        att_result = await self.db.execute(
            select(Attendance).where(
                Attendance.company_id == company_id,
                Attendance.employee_id == employee_id,
                Attendance.attendance_date >= month_start,
                Attendance.attendance_date <= month_end,
                Attendance.is_deleted == False,
            )
        )
        attendance_records = att_result.scalars().all()

        # Approved leave days for this month
        leave_result = await self.db.execute(
            select(LeaveRequest).where(
                LeaveRequest.company_id == company_id,
                LeaveRequest.employee_id == employee_id,
                LeaveRequest.status == "approved",
                LeaveRequest.start_date <= month_end,
                LeaveRequest.end_date >= month_start,
                LeaveRequest.is_deleted == False,
            )
        )
        approved_leaves = leave_result.scalars().all()

        # Calculate leave days within this month
        days_on_approved_leave = 0
        for leave in approved_leaves:
            overlap_start = max(leave.start_date, month_start)
            overlap_end = min(leave.end_date, month_end)
            if overlap_start <= overlap_end:
                delta = (overlap_end - overlap_start).days + 1
                days_on_approved_leave += delta

        # Days present/absent/late
        days_present = sum(1 for a in attendance_records if a.status in ("present", "late", "half_day"))
        late_count = sum(1 for a in attendance_records if a.status == "late")
        half_day_count = sum(1 for a in attendance_records if a.status == "half_day")
        days_absent = max(0, total_working_days - days_on_approved_leave - days_present)

        # LOP from absences
        lop_from_absence = Decimal(str(days_absent)) if policy.apply_lop_on_absent else Decimal("0")

        # LOP from lates (each set of lates_per_half_day lates beyond grace = 0.5 day)
        excess_lates = max(0, late_count - policy.late_grace_count)
        lop_from_lates = Decimal(str((excess_lates // policy.lates_per_half_day) * 0.5)) if policy.lates_per_half_day > 0 else Decimal("0")

        total_lop_days = lop_from_absence + lop_from_lates

        # Cap
        if policy.max_lop_days_per_month is not None:
            total_lop_days = min(total_lop_days, Decimal(str(policy.max_lop_days_per_month)))

        # Round to nearest 0.5 if enabled
        if policy.round_to_half_day:
            total_lop_days = (total_lop_days * 2).quantize(Decimal("1"), rounding=ROUND_HALF_UP) / 2

        return {
            "total_working_days": total_working_days,
            "days_present": days_present,
            "days_absent": days_absent,
            "days_on_approved_leave": days_on_approved_leave,
            "late_count": late_count,
            "lop_from_absence": lop_from_absence,
            "lop_from_lates": lop_from_lates,
            "total_lop_days": total_lop_days,
            "final_lop_days": total_lop_days,
        }


# ─── Record Service ───────────────────────────────────────────────────────────


class LOPRecordService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_or_calculate(
        self,
        company_id: str,
        employee_id: str,
        year: int,
        month: int,
        created_by: str,
        recalculate: bool = False,
    ) -> LOPRecord:
        """Get existing record or calculate and save a new one."""
        result = await self.db.execute(
            select(LOPRecord).where(
                LOPRecord.company_id == company_id,
                LOPRecord.employee_id == employee_id,
                LOPRecord.year == year,
                LOPRecord.month == month,
                LOPRecord.is_deleted == False,
            )
        )
        existing = result.scalar_one_or_none()
        if existing and not recalculate:
            return existing

        policy_svc = LOPPolicyService(self.db)
        policy = await policy_svc.get_or_create_default(company_id, created_by)
        calc_svc = LOPCalculationService(self.db)
        calc = await calc_svc.calculate(company_id, employee_id, year, month, policy)

        if existing:
            for key, val in calc.items():
                setattr(existing, key, val)
            existing.updated_by = created_by
            await self.db.flush()
            await self.db.refresh(existing)
            return existing

        bid = await BusinessIdService.generate(self.db, "lop_record")
        record = LOPRecord(
            id=str(uuid.uuid4()),
            business_id=bid,
            company_id=company_id,
            employee_id=employee_id,
            year=year,
            month=month,
            created_by=created_by,
            **calc,
        )
        self.db.add(record)
        await self.db.flush()
        await self.db.refresh(record)
        return record

    async def list(
        self,
        company_id: str,
        params: PaginationParams,
        year: Optional[int] = None,
        month: Optional[int] = None,
        employee_id: Optional[str] = None,
        status: Optional[str] = None,
    ) -> Tuple[List[LOPRecord], int]:
        conditions = [LOPRecord.company_id == company_id, LOPRecord.is_deleted == False]
        if year:
            conditions.append(LOPRecord.year == year)
        if month:
            conditions.append(LOPRecord.month == month)
        if employee_id:
            conditions.append(LOPRecord.employee_id == employee_id)
        if status:
            conditions.append(LOPRecord.status == status)

        count_q = select(func.count()).select_from(LOPRecord).where(and_(*conditions))
        total = (await self.db.execute(count_q)).scalar() or 0

        q = (
            select(LOPRecord)
            .where(and_(*conditions))
            .order_by(LOPRecord.year.desc(), LOPRecord.month.desc())
            .offset(params.offset)
            .limit(params.page_size)
        )
        result = await self.db.execute(q)
        return list(result.scalars().all()), total

    async def get(self, business_id: str, company_id: str) -> LOPRecord:
        result = await self.db.execute(
            select(LOPRecord).where(
                LOPRecord.business_id == business_id,
                LOPRecord.company_id == company_id,
                LOPRecord.is_deleted == False,
            )
        )
        record = result.scalar_one_or_none()
        if not record:
            raise NotFoundException("LOP record not found")
        return record

    async def approve(self, business_id: str, company_id: str, approved_by: str) -> LOPRecord:
        record = await self.get(business_id, company_id)
        if record.status == "applied":
            raise BadRequestException("LOP record is already applied to payroll")
        record.status = "approved"
        record.approved_by = approved_by
        record.approved_at = date.today()
        record.updated_by = approved_by
        await self.db.flush()
        await self.db.refresh(record)
        return record


# ─── Override Service ─────────────────────────────────────────────────────────


class LOPOverrideService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        company_id: str,
        employee_id: str,
        year: int,
        month: int,
        original_lop_days: Decimal,
        adjusted_lop_days: Decimal,
        reason: str,
        created_by: str,
    ) -> LOPOverride:
        if adjusted_lop_days < 0:
            raise BadRequestException("Adjusted LOP days cannot be negative")

        bid = await BusinessIdService.generate(self.db, "lop_override")
        override = LOPOverride(
            id=str(uuid.uuid4()),
            business_id=bid,
            company_id=company_id,
            employee_id=employee_id,
            year=year,
            month=month,
            original_lop_days=original_lop_days,
            adjusted_lop_days=adjusted_lop_days,
            reason=reason,
            created_by=created_by,
        )
        self.db.add(override)
        await self.db.flush()
        await self.db.refresh(override)
        return override

    async def list(
        self,
        company_id: str,
        params: PaginationParams,
        employee_id: Optional[str] = None,
        year: Optional[int] = None,
        month: Optional[int] = None,
    ) -> Tuple[List[LOPOverride], int]:
        conditions = [LOPOverride.company_id == company_id]
        if employee_id:
            conditions.append(LOPOverride.employee_id == employee_id)
        if year:
            conditions.append(LOPOverride.year == year)
        if month:
            conditions.append(LOPOverride.month == month)

        count_q = select(func.count()).select_from(LOPOverride).where(and_(*conditions))
        total = (await self.db.execute(count_q)).scalar() or 0

        q = (
            select(LOPOverride)
            .where(and_(*conditions))
            .order_by(LOPOverride.year.desc(), LOPOverride.month.desc())
            .offset(params.offset)
            .limit(params.page_size)
        )
        result = await self.db.execute(q)
        return list(result.scalars().all()), total

    async def get(self, business_id: str, company_id: str) -> LOPOverride:
        result = await self.db.execute(
            select(LOPOverride).where(
                LOPOverride.business_id == business_id,
                LOPOverride.company_id == company_id,
            )
        )
        override = result.scalar_one_or_none()
        if not override:
            raise NotFoundException("LOP override not found")
        return override

    async def approve(self, business_id: str, company_id: str, approved_by: str) -> LOPOverride:
        override = await self.get(business_id, company_id)
        if override.status != "pending":
            raise BadRequestException(f"Override is already {override.status}")
        override.status = "approved"
        override.approved_by = approved_by
        override.approved_at = date.today()
        await self.db.flush()
        # Apply override to corresponding LOPRecord
        lop_result = await self.db.execute(
            select(LOPRecord).where(
                LOPRecord.company_id == company_id,
                LOPRecord.employee_id == override.employee_id,
                LOPRecord.year == override.year,
                LOPRecord.month == override.month,
                LOPRecord.is_deleted == False,
            )
        )
        record = lop_result.scalar_one_or_none()
        if record:
            record.override_id = override.id
            record.final_lop_days = override.adjusted_lop_days
            record.updated_by = approved_by
        await self.db.flush()
        await self.db.refresh(override)
        return override
