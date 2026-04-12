"""Service for leave policies, leave types, leave balances, and attendance policies."""
from __future__ import annotations

from datetime import date
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.policy import (
    LeavePolicy, LeaveType as LeaveTypeModel, LeaveBalance,
    AttendancePolicy, CountryConfig, StateConfig,
)
from app.services.business_id_service import generate_business_id


class LeavePolicyService:

    @staticmethod
    async def create(db: AsyncSession, company_id: str, data: dict) -> LeavePolicy:
        policy = LeavePolicy(
            id=__import__("uuid").uuid4().__str__(),
            business_id=await generate_business_id(db, "LPOL"),
            company_id=company_id,
            **data,
        )
        db.add(policy)
        await db.flush()
        return policy

    @staticmethod
    async def list(db: AsyncSession, company_id: str) -> list[LeavePolicy]:
        result = await db.execute(
            select(LeavePolicy).where(
                LeavePolicy.company_id == company_id,
                LeavePolicy.is_deleted == False,
            ).order_by(LeavePolicy.name)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get(db: AsyncSession, company_id: str, business_id: str) -> Optional[LeavePolicy]:
        result = await db.execute(
            select(LeavePolicy).where(
                LeavePolicy.business_id == business_id,
                LeavePolicy.company_id == company_id,
                LeavePolicy.is_deleted == False,
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def update(db: AsyncSession, company_id: str, business_id: str, data: dict) -> Optional[LeavePolicy]:
        policy = await LeavePolicyService.get(db, company_id, business_id)
        if not policy:
            return None
        for key, value in data.items():
            if value is not None and hasattr(policy, key):
                setattr(policy, key, value)
        await db.flush()
        return policy


class LeaveTypeService:

    @staticmethod
    async def create(db: AsyncSession, company_id: str, data: dict) -> LeaveTypeModel:
        leave_type = LeaveTypeModel(
            id=__import__("uuid").uuid4().__str__(),
            business_id=await generate_business_id(db, "LT"),
            company_id=company_id,
            **data,
        )
        db.add(leave_type)
        await db.flush()
        return leave_type

    @staticmethod
    async def list_by_policy(db: AsyncSession, company_id: str, leave_policy_id: str) -> list[LeaveTypeModel]:
        # Resolve leave_policy_id from business_id if needed
        policy = await db.execute(
            select(LeavePolicy).where(
                LeavePolicy.business_id == leave_policy_id,
                LeavePolicy.company_id == company_id,
                LeavePolicy.is_deleted == False,
            )
        )
        pol = policy.scalar_one_or_none()
        if not pol:
            return []

        result = await db.execute(
            select(LeaveTypeModel).where(
                LeaveTypeModel.leave_policy_id == pol.id,
                LeaveTypeModel.company_id == company_id,
                LeaveTypeModel.is_deleted == False,
            ).order_by(LeaveTypeModel.name)
        )
        return list(result.scalars().all())

    @staticmethod
    async def list_by_company(db: AsyncSession, company_id: str) -> list[LeaveTypeModel]:
        result = await db.execute(
            select(LeaveTypeModel).where(
                LeaveTypeModel.company_id == company_id,
                LeaveTypeModel.is_deleted == False,
            ).order_by(LeaveTypeModel.name)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get(db: AsyncSession, company_id: str, business_id: str) -> Optional[LeaveTypeModel]:
        result = await db.execute(
            select(LeaveTypeModel).where(
                LeaveTypeModel.business_id == business_id,
                LeaveTypeModel.company_id == company_id,
                LeaveTypeModel.is_deleted == False,
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def update(db: AsyncSession, company_id: str, business_id: str, data: dict) -> Optional[LeaveTypeModel]:
        lt = await LeaveTypeService.get(db, company_id, business_id)
        if not lt:
            return None
        for key, value in data.items():
            if value is not None and hasattr(lt, key):
                setattr(lt, key, value)
        await db.flush()
        return lt


class LeaveBalanceService:

    @staticmethod
    async def get_employee_balances(
        db: AsyncSession, company_id: str, employee_id: str, year: Optional[int] = None
    ) -> list[dict]:
        if year is None:
            year = date.today().year

        # Get all leave types for the company
        leave_types = await LeaveTypeService.list_by_company(db, company_id)
        balances = []

        for lt in leave_types:
            result = await db.execute(
                select(LeaveBalance).where(
                    LeaveBalance.employee_id == employee_id,
                    LeaveBalance.leave_type_id == lt.id,
                    LeaveBalance.year == year,
                    LeaveBalance.is_deleted == False,
                )
            )
            balance = result.scalar_one_or_none()
            if balance:
                balances.append({
                    "business_id": balance.business_id,
                    "employee_id": employee_id,
                    "leave_type_id": lt.business_id,
                    "leave_type_name": lt.name,
                    "leave_type_code": lt.code,
                    "year": year,
                    "allocated": balance.allocated,
                    "used": balance.used,
                    "pending": balance.pending,
                    "carried_forward": balance.carried_forward,
                    "available": balance.available,
                })
            else:
                balances.append({
                    "business_id": "",
                    "employee_id": employee_id,
                    "leave_type_id": lt.business_id,
                    "leave_type_name": lt.name,
                    "leave_type_code": lt.code,
                    "year": year,
                    "allocated": lt.annual_quota,
                    "used": 0,
                    "pending": 0,
                    "carried_forward": 0,
                    "available": lt.annual_quota,
                })

        return balances

    @staticmethod
    async def allocate_for_employee(
        db: AsyncSession, company_id: str, employee_id: str, year: Optional[int] = None
    ) -> list[LeaveBalance]:
        if year is None:
            year = date.today().year

        leave_types = await LeaveTypeService.list_by_company(db, company_id)
        results = []

        for lt in leave_types:
            existing = await db.execute(
                select(LeaveBalance).where(
                    LeaveBalance.employee_id == employee_id,
                    LeaveBalance.leave_type_id == lt.id,
                    LeaveBalance.year == year,
                )
            )
            balance = existing.scalar_one_or_none()
            if not balance:
                balance = LeaveBalance(
                    id=__import__("uuid").uuid4().__str__(),
                    business_id=await generate_business_id(db, "LBAL"),
                    company_id=company_id,
                    employee_id=employee_id,
                    leave_type_id=lt.id,
                    year=year,
                    allocated=lt.annual_quota,
                )
                db.add(balance)
            results.append(balance)

        await db.flush()
        return results

    @staticmethod
    async def deduct(
        db: AsyncSession, employee_id: str, leave_type_id: str, days: float, year: int
    ) -> Optional[LeaveBalance]:
        result = await db.execute(
            select(LeaveBalance).where(
                LeaveBalance.employee_id == employee_id,
                LeaveBalance.leave_type_id == leave_type_id,
                LeaveBalance.year == year,
            )
        )
        balance = result.scalar_one_or_none()
        if not balance or balance.available < days:
            return None
        balance.used += days
        await db.flush()
        return balance

    @staticmethod
    async def add_pending(
        db: AsyncSession, employee_id: str, leave_type_id: str, days: float, year: int
    ) -> Optional[LeaveBalance]:
        result = await db.execute(
            select(LeaveBalance).where(
                LeaveBalance.employee_id == employee_id,
                LeaveBalance.leave_type_id == leave_type_id,
                LeaveBalance.year == year,
            )
        )
        balance = result.scalar_one_or_none()
        if balance:
            balance.pending += days
            await db.flush()
        return balance


class AttendancePolicyService:

    @staticmethod
    async def get_or_create(db: AsyncSession, company_id: str) -> AttendancePolicy:
        result = await db.execute(
            select(AttendancePolicy).where(
                AttendancePolicy.company_id == company_id,
                AttendancePolicy.is_deleted == False,
            )
        )
        policy = result.scalar_one_or_none()
        if not policy:
            policy = AttendancePolicy(
                id=__import__("uuid").uuid4().__str__(),
                business_id=await generate_business_id(db, "ATTPOL"),
                company_id=company_id,
                name="Default Attendance Policy",
            )
            db.add(policy)
            await db.flush()
        return policy

    @staticmethod
    async def update(db: AsyncSession, company_id: str, data: dict) -> AttendancePolicy:
        policy = await AttendancePolicyService.get_or_create(db, company_id)
        for key, value in data.items():
            if value is not None and hasattr(policy, key):
                setattr(policy, key, value)
        await db.flush()
        return policy


class CountryConfigService:

    @staticmethod
    async def list_all(db: AsyncSession) -> list[CountryConfig]:
        result = await db.execute(
            select(CountryConfig).where(CountryConfig.is_deleted == False)
            .order_by(CountryConfig.country_name)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_by_code(db: AsyncSession, country_code: str) -> Optional[CountryConfig]:
        result = await db.execute(
            select(CountryConfig).where(
                CountryConfig.country_code == country_code,
                CountryConfig.is_deleted == False,
            )
        )
        return result.scalar_one_or_none()
