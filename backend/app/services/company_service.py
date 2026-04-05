from __future__ import annotations

from typing import List, Optional, Tuple

from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException, ConflictException
from app.core.pagination import PaginationParams
from app.models.company import Company
from app.models.user import User
from app.repositories.base import BaseRepository
from app.schemas.company import CompanyCreate, CompanyUpdate
from app.schemas.user import UserCreate, UserUpdate, UserStatusUpdate
from app.services.business_id_service import BusinessIdService
from app.utils.enums import UserStatus
from app.utils.helpers import slugify_name
import uuid


class CompanyService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = BaseRepository(Company, db)

    async def get_my_company(self, company_id: str) -> Company:
        company = await self.repo.get_by_id(company_id)
        if not company:
            raise NotFoundException("Company not found")
        return company

    async def update_company(self, company_id: str, data: CompanyUpdate, updated_by: str) -> Company:
        company = await self.repo.get_by_id(company_id)
        if not company:
            raise NotFoundException("Company not found")
        update_dict = data.model_dump(exclude_unset=True)
        update_dict["updated_by"] = updated_by
        return await self.repo.update(company, update_dict)

    async def list_all_companies(
        self, params: PaginationParams
    ) -> Tuple[List[Company], int]:
        conditions = []
        if params.q:
            q = f"%{params.q}%"
            conditions.append(
                or_(
                    Company.name.ilike(q),
                    Company.email.ilike(q),
                    Company.slug.ilike(q),
                    Company.business_id.ilike(q),
                )
            )
        return await self.repo.list(params=params, extra_conditions=conditions)

    async def get_company_by_business_id(self, business_id: str) -> Company:
        company = await self.repo.get_by_business_id(business_id)
        if not company:
            raise NotFoundException(f"Company '{business_id}' not found")
        return company


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = BaseRepository(User, db)

    async def create_user(self, data: UserCreate, company_id: str, created_by: str) -> User:
        existing = await self.db.execute(
            select(User).where(
                User.email == data.email,
                User.company_id == company_id,
                User.is_deleted == False,
            )
        )
        if existing.scalar_one_or_none():
            raise ConflictException(f"User '{data.email}' already exists")

        from app.core.security import hash_password
        bid = await BusinessIdService.generate(self.db, "user")
        user = User(
            id=str(uuid.uuid4()),
            business_id=bid,
            company_id=company_id,
            full_name=data.full_name,
            first_name=data.first_name,
            last_name=data.last_name,
            email=data.email,
            phone=data.phone,
            role=data.role.value,
            status=UserStatus.ACTIVE.value,
            password_hash=hash_password(data.password) if data.password else None,
            created_by=created_by,
        )
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def list_users(self, company_id: str, params: PaginationParams) -> Tuple[List[User], int]:
        conditions = []
        if params.q:
            q = f"%{params.q}%"
            conditions.append(
                or_(
                    User.full_name.ilike(q),
                    User.email.ilike(q),
                    User.business_id.ilike(q),
                )
            )
        return await self.repo.list(company_id=company_id, params=params, extra_conditions=conditions)

    async def get_user(self, business_id: str, company_id: str) -> User:
        return await self.repo.get_or_404(business_id, company_id)

    async def update_user(self, business_id: str, data: UserUpdate, company_id: str, updated_by: str) -> User:
        user = await self.repo.get_or_404(business_id, company_id)
        update_dict = data.model_dump(exclude_unset=True)
        if "role" in update_dict and update_dict["role"]:
            update_dict["role"] = update_dict["role"].value if hasattr(update_dict["role"], "value") else update_dict["role"]
        update_dict["updated_by"] = updated_by
        return await self.repo.update(user, update_dict)

    async def update_status(self, business_id: str, data: UserStatusUpdate, company_id: str, updated_by: str) -> User:
        user = await self.repo.get_or_404(business_id, company_id)
        user.status = data.status.value
        user.updated_by = updated_by
        await self.db.flush()
        await self.db.refresh(user)
        return user
