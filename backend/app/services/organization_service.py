"""Service for organization settings, branches, designations, and shifts."""
from __future__ import annotations

from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.organization import Branch, Designation, OrganizationSettings
from app.models.shift import Shift
from app.services.business_id_service import generate_business_id


class OrganizationSettingsService:

    @staticmethod
    async def get_or_create(db: AsyncSession, company_id: str) -> OrganizationSettings:
        result = await db.execute(
            select(OrganizationSettings).where(
                OrganizationSettings.company_id == company_id,
                OrganizationSettings.is_deleted == False,
            )
        )
        settings = result.scalar_one_or_none()
        if not settings:
            settings = OrganizationSettings(
                id=__import__("uuid").uuid4().__str__(),
                business_id=await generate_business_id(db, "ORGSET"),
                company_id=company_id,
            )
            db.add(settings)
            await db.flush()
        return settings

    @staticmethod
    async def update(db: AsyncSession, company_id: str, data: dict) -> OrganizationSettings:
        settings = await OrganizationSettingsService.get_or_create(db, company_id)
        for key, value in data.items():
            if value is not None and hasattr(settings, key):
                setattr(settings, key, value)
        await db.flush()
        return settings


class BranchService:

    @staticmethod
    async def create(db: AsyncSession, company_id: str, data: dict) -> Branch:
        branch = Branch(
            id=__import__("uuid").uuid4().__str__(),
            business_id=await generate_business_id(db, "BRN"),
            company_id=company_id,
            **data,
        )
        db.add(branch)
        await db.flush()
        return branch

    @staticmethod
    async def list(db: AsyncSession, company_id: str, q: Optional[str] = None,
                   page: int = 1, page_size: int = 50) -> tuple[list[Branch], int]:
        conditions = [Branch.company_id == company_id, Branch.is_deleted == False]
        if q:
            conditions.append(Branch.name.ilike(f"%{q}%"))

        count_q = select(func.count()).select_from(Branch).where(*conditions)
        total = (await db.execute(count_q)).scalar() or 0

        query = (
            select(Branch).where(*conditions)
            .order_by(Branch.name)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await db.execute(query)
        return list(result.scalars().all()), total

    @staticmethod
    async def get(db: AsyncSession, company_id: str, business_id: str) -> Optional[Branch]:
        result = await db.execute(
            select(Branch).where(
                Branch.business_id == business_id,
                Branch.company_id == company_id,
                Branch.is_deleted == False,
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def update(db: AsyncSession, company_id: str, business_id: str, data: dict) -> Optional[Branch]:
        branch = await BranchService.get(db, company_id, business_id)
        if not branch:
            return None
        for key, value in data.items():
            if value is not None and hasattr(branch, key):
                setattr(branch, key, value)
        await db.flush()
        return branch

    @staticmethod
    async def delete(db: AsyncSession, company_id: str, business_id: str) -> bool:
        branch = await BranchService.get(db, company_id, business_id)
        if not branch:
            return False
        branch.is_deleted = True
        await db.flush()
        return True


class DesignationService:

    @staticmethod
    async def create(db: AsyncSession, company_id: str, data: dict) -> Designation:
        designation = Designation(
            id=__import__("uuid").uuid4().__str__(),
            business_id=await generate_business_id(db, "DESG"),
            company_id=company_id,
            **data,
        )
        db.add(designation)
        await db.flush()
        return designation

    @staticmethod
    async def list(db: AsyncSession, company_id: str, q: Optional[str] = None,
                   page: int = 1, page_size: int = 50) -> tuple[list[Designation], int]:
        conditions = [Designation.company_id == company_id, Designation.is_deleted == False]
        if q:
            conditions.append(Designation.name.ilike(f"%{q}%"))

        count_q = select(func.count()).select_from(Designation).where(*conditions)
        total = (await db.execute(count_q)).scalar() or 0

        query = (
            select(Designation).where(*conditions)
            .order_by(Designation.level.asc().nulls_last(), Designation.name)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await db.execute(query)
        return list(result.scalars().all()), total

    @staticmethod
    async def get(db: AsyncSession, company_id: str, business_id: str) -> Optional[Designation]:
        result = await db.execute(
            select(Designation).where(
                Designation.business_id == business_id,
                Designation.company_id == company_id,
                Designation.is_deleted == False,
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def update(db: AsyncSession, company_id: str, business_id: str, data: dict) -> Optional[Designation]:
        designation = await DesignationService.get(db, company_id, business_id)
        if not designation:
            return None
        for key, value in data.items():
            if value is not None and hasattr(designation, key):
                setattr(designation, key, value)
        await db.flush()
        return designation

    @staticmethod
    async def delete(db: AsyncSession, company_id: str, business_id: str) -> bool:
        designation = await DesignationService.get(db, company_id, business_id)
        if not designation:
            return False
        designation.is_deleted = True
        await db.flush()
        return True


class ShiftService:

    @staticmethod
    async def create(db: AsyncSession, company_id: str, data: dict) -> Shift:
        shift = Shift(
            id=__import__("uuid").uuid4().__str__(),
            business_id=await generate_business_id(db, "SHIFT"),
            company_id=company_id,
            **data,
        )
        db.add(shift)
        await db.flush()
        return shift

    @staticmethod
    async def list(db: AsyncSession, company_id: str, q: Optional[str] = None,
                   page: int = 1, page_size: int = 50) -> tuple[list[Shift], int]:
        conditions = [Shift.company_id == company_id, Shift.is_deleted == False]
        if q:
            conditions.append(Shift.name.ilike(f"%{q}%"))

        count_q = select(func.count()).select_from(Shift).where(*conditions)
        total = (await db.execute(count_q)).scalar() or 0

        query = (
            select(Shift).where(*conditions)
            .order_by(Shift.name)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await db.execute(query)
        return list(result.scalars().all()), total

    @staticmethod
    async def get(db: AsyncSession, company_id: str, business_id: str) -> Optional[Shift]:
        result = await db.execute(
            select(Shift).where(
                Shift.business_id == business_id,
                Shift.company_id == company_id,
                Shift.is_deleted == False,
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def update(db: AsyncSession, company_id: str, business_id: str, data: dict) -> Optional[Shift]:
        shift = await ShiftService.get(db, company_id, business_id)
        if not shift:
            return None
        for key, value in data.items():
            if value is not None and hasattr(shift, key):
                setattr(shift, key, value)
        await db.flush()
        return shift

    @staticmethod
    async def delete(db: AsyncSession, company_id: str, business_id: str) -> bool:
        shift = await ShiftService.get(db, company_id, business_id)
        if not shift:
            return False
        shift.is_deleted = True
        await db.flush()
        return True
