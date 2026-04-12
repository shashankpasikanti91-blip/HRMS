from __future__ import annotations

from datetime import date, datetime, timezone
from typing import List, Optional, Tuple

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException, ConflictException, BadRequestException
from app.core.pagination import PaginationParams
from app.models.payroll import PayrollRun, PayrollItem
from app.models.employee import Employee
from app.repositories.base import BaseRepository
from app.schemas.payroll import PayrollRunCreate
from app.services.business_id_service import BusinessIdService
from app.utils.enums import PayrollStatus, PaymentStatus
import uuid


class PayrollService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.run_repo = BaseRepository(PayrollRun, db)
        self.item_repo = BaseRepository(PayrollItem, db)

    async def create_run(self, data: PayrollRunCreate, company_id: str, created_by: str) -> PayrollRun:
        # Check for existing run in same period
        existing = await self.db.execute(
            select(PayrollRun).where(
                PayrollRun.company_id == company_id,
                PayrollRun.period_month == data.period_month,
                PayrollRun.period_year == data.period_year,
                PayrollRun.is_deleted == False,
            )
        )
        if existing.scalar_one_or_none():
            raise ConflictException(f"Payroll run for {data.period_month}/{data.period_year} already exists")

        bid = await BusinessIdService.generate(self.db, "payroll_run")
        run = PayrollRun(
            id=str(uuid.uuid4()),
            business_id=bid,
            company_id=company_id,
            period_month=data.period_month,
            period_year=data.period_year,
            status=PayrollStatus.DRAFT.value,
            notes=data.notes,
            created_by=created_by,
        )
        self.db.add(run)
        await self.db.flush()
        await self.db.refresh(run)
        return run

    async def list_runs(self, company_id: str, params: PaginationParams, year: Optional[int] = None) -> Tuple[List[PayrollRun], int]:
        extra = []
        if year:
            extra.append(PayrollRun.period_year == year)
        return await self.run_repo.list(company_id=company_id, params=params, extra_conditions=extra if extra else None)

    async def get_run(self, business_id: str, company_id: str) -> PayrollRun:
        return await self.run_repo.get_or_404(business_id, company_id)

    async def process_run(self, business_id: str, company_id: str, processed_by: str) -> PayrollRun:
        run = await self.run_repo.get_or_404(business_id, company_id)
        if run.status not in (PayrollStatus.DRAFT.value, PayrollStatus.PROCESSING.value):
            raise BadRequestException(f"Cannot process a payroll run in '{run.status}' status")

        run.status = PayrollStatus.PROCESSING.value
        await self.db.flush()

        # Get all active employees for this company
        employees_result = await self.db.execute(
            select(Employee).where(
                Employee.company_id == company_id,
                Employee.employment_status == "active",
                Employee.is_deleted == False,
            )
        )
        employees = list(employees_result.scalars().all())

        total_gross = 0.0
        total_deductions = 0.0
        total_net = 0.0

        # Pre-generate unique business IDs for the batch
        # Count existing items once, then increment for each new item
        from sqlalchemy import text
        count_result = await self.db.execute(text("SELECT COUNT(*) FROM payroll_items"))
        base_count = count_result.scalar() or 0

        item_index = 0
        for emp in employees:
            # Basic payroll calculation (extend with real salary structures)
            gross = 50000.0  # placeholder – use salary component tables in v2
            allowances = gross * 0.20
            deductions = gross * 0.12
            tax = gross * 0.10
            net = gross + allowances - deductions - tax

            total_gross += gross
            total_deductions += deductions + tax
            total_net += net

            # Check if item already exists
            existing_item = await self.db.execute(
                select(PayrollItem).where(
                    PayrollItem.payroll_run_id == run.id,
                    PayrollItem.employee_id == emp.id,
                )
            )
            if existing_item.scalar_one_or_none():
                continue

            item_index += 1
            sequence = base_count + item_index
            item_bid = f"PAYITM-{str(sequence).zfill(6)}"
            item = PayrollItem(
                id=str(uuid.uuid4()),
                business_id=item_bid,
                company_id=company_id,
                payroll_run_id=run.id,
                employee_id=emp.id,
                basic_salary=gross,
                gross_salary=gross + allowances,
                allowances=allowances,
                deductions=deductions,
                tax_amount=tax,
                total_deductions=deductions + tax,
                net_salary=net,
                payment_status=PaymentStatus.PENDING.value,
                created_by=processed_by,
            )
            self.db.add(item)

        await self.db.flush()

        run.status = PayrollStatus.PROCESSED.value
        run.processed_at = datetime.now(tz=timezone.utc)
        run.total_employees = len(employees)
        run.total_gross = total_gross
        run.total_deductions = total_deductions
        run.total_net = total_net
        run.updated_by = processed_by
        await self.db.flush()
        await self.db.refresh(run)
        return run

    async def approve_run(self, business_id: str, company_id: str, approved_by: str) -> PayrollRun:
        run = await self.run_repo.get_or_404(business_id, company_id)
        if run.status not in (PayrollStatus.PROCESSED.value, PayrollStatus.PROCESSING.value):
            raise BadRequestException(f"Cannot approve a payroll run in '{run.status}' status")
        run.status = PayrollStatus.APPROVED.value
        run.updated_by = approved_by
        await self.db.flush()
        await self.db.refresh(run)
        return run

    async def get_items(self, run_business_id: str, company_id: str, params: PaginationParams) -> Tuple[List[PayrollItem], int]:
        run = await self.run_repo.get_or_404(run_business_id, company_id)
        return await self.item_repo.list(
            company_id=company_id,
            params=params,
            filters={"payroll_run_id": run.id},
        )
