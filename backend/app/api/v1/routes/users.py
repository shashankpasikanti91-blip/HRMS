from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_hr_or_above
from app.core.pagination import PaginationParams, Page
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserStatusUpdate, UserResponse, UserSummary
from app.services.company_service import UserService

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("", response_model=UserResponse, status_code=201)
async def create_user(
    data: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    service = UserService(db)
    user = await service.create_user(data, current_user.company_id, current_user.id)
    return UserResponse.model_validate(user)


@router.get("", response_model=Page[UserSummary])
async def list_users(
    params: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = UserService(db)
    users, total = await service.list_users(current_user.company_id, params)
    return Page.create([UserSummary.model_validate(u) for u in users], total, params)


@router.get("/{business_id}", response_model=UserResponse)
async def get_user(
    business_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = UserService(db)
    user = await service.get_user(business_id, current_user.company_id)
    return UserResponse.model_validate(user)


@router.put("/{business_id}", response_model=UserResponse)
async def update_user(
    business_id: str,
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    service = UserService(db)
    user = await service.update_user(business_id, data, current_user.company_id, current_user.id)
    return UserResponse.model_validate(user)


@router.patch("/{business_id}/status", response_model=UserResponse)
async def update_user_status(
    business_id: str,
    data: UserStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr_or_above()),
):
    service = UserService(db)
    user = await service.update_status(business_id, data, current_user.company_id, current_user.id)
    return UserResponse.model_validate(user)
