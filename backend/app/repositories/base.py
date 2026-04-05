from __future__ import annotations

from typing import Any, Dict, Generic, List, Optional, Tuple, Type, TypeVar
from sqlalchemy import select, func, update, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import DeclarativeBase

from app.core.pagination import PaginationParams
from app.core.exceptions import NotFoundException

ModelType = TypeVar("ModelType", bound=DeclarativeBase)


class BaseRepository(Generic[ModelType]):
    """Generic async CRUD repository."""

    def __init__(self, model: Type[ModelType], db: AsyncSession):
        self.model = model
        self.db = db

    async def get_by_id(self, id: str, company_id: Optional[str] = None) -> Optional[ModelType]:
        stmt = select(self.model).where(
            self.model.id == id,
            self.model.is_deleted == False,
        )
        if company_id and hasattr(self.model, "company_id"):
            stmt = stmt.where(self.model.company_id == company_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_business_id(self, business_id: str, company_id: Optional[str] = None) -> Optional[ModelType]:
        stmt = select(self.model).where(
            self.model.business_id == business_id,
            self.model.is_deleted == False,
        )
        if company_id and hasattr(self.model, "company_id"):
            stmt = stmt.where(self.model.company_id == company_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_or_404(self, business_id: str, company_id: Optional[str] = None) -> ModelType:
        obj = await self.get_by_business_id(business_id, company_id)
        if not obj:
            raise NotFoundException(f"{self.model.__name__} '{business_id}' not found")
        return obj

    async def list(
        self,
        company_id: Optional[str] = None,
        params: Optional[PaginationParams] = None,
        filters: Optional[Dict[str, Any]] = None,
        extra_conditions: Optional[list] = None,
    ) -> Tuple[List[ModelType], int]:
        stmt = select(self.model).where(self.model.is_deleted == False)
        count_stmt = select(func.count()).select_from(self.model).where(self.model.is_deleted == False)

        if company_id and hasattr(self.model, "company_id"):
            stmt = stmt.where(self.model.company_id == company_id)
            count_stmt = count_stmt.where(self.model.company_id == company_id)

        if filters:
            for key, value in filters.items():
                if hasattr(self.model, key) and value is not None:
                    stmt = stmt.where(getattr(self.model, key) == value)
                    count_stmt = count_stmt.where(getattr(self.model, key) == value)

        if extra_conditions:
            for cond in extra_conditions:
                stmt = stmt.where(cond)
                count_stmt = count_stmt.where(cond)

        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar() or 0

        if params:
            # Sorting
            if params.sort_by and hasattr(self.model, params.sort_by):
                col = getattr(self.model, params.sort_by)
                stmt = stmt.order_by(col.asc() if params.sort_order == "asc" else col.desc())
            else:
                stmt = stmt.order_by(self.model.created_at.desc())
            stmt = stmt.offset(params.offset).limit(params.limit)

        result = await self.db.execute(stmt)
        return list(result.scalars().all()), total

    async def create(self, obj: ModelType) -> ModelType:
        self.db.add(obj)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def update(self, obj: ModelType, data: Dict[str, Any]) -> ModelType:
        for key, value in data.items():
            if hasattr(obj, key) and value is not None:
                setattr(obj, key, value)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def soft_delete(self, obj: ModelType, deleted_by: Optional[str] = None) -> ModelType:
        from datetime import datetime, timezone
        obj.is_deleted = True
        obj.deleted_at = datetime.now(tz=timezone.utc)
        if deleted_by and hasattr(obj, "updated_by"):
            obj.updated_by = deleted_by
        await self.db.flush()
        return obj

    async def count(self, company_id: Optional[str] = None, filters: Optional[Dict[str, Any]] = None) -> int:
        stmt = select(func.count()).select_from(self.model).where(self.model.is_deleted == False)
        if company_id and hasattr(self.model, "company_id"):
            stmt = stmt.where(self.model.company_id == company_id)
        if filters:
            for key, value in filters.items():
                if hasattr(self.model, key) and value is not None:
                    stmt = stmt.where(getattr(self.model, key) == value)
        result = await self.db.execute(stmt)
        return result.scalar() or 0
