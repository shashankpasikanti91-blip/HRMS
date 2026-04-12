from __future__ import annotations

from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_hr_or_above, require_company_admin_or_above
from app.core.pagination import PaginationParams, Page
from app.core.security import hash_password
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserStatusUpdate, UserResponse, UserSummary, AdminResetPasswordRequest
from app.services.company_service import UserService

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
async def get_my_user(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user profile."""
    return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
async def update_my_user(
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Allow a signed-in user to update their own profile."""
    service = UserService(db)
    user = await service.update_user(current_user.business_id, data, current_user.company_id, current_user.id)
    return UserResponse.model_validate(user)


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


@router.post("/{business_id}/reset-password", response_model=dict)
async def admin_reset_password(
    business_id: str,
    data: AdminResetPasswordRequest = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_company_admin_or_above()),
):
    """Admin endpoint to reset a user's password without needing the old password."""
    service = UserService(db)
    target_user = await service.get_user(business_id, current_user.company_id)
    target_user.password_hash = hash_password(data.new_password)
    await db.flush()
    await db.commit()
    return {"message": f"Password reset for {target_user.email}"}
