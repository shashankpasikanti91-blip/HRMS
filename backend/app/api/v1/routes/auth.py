from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.auth import (
    RegisterCompanyRequest,
    LoginRequest,
    RefreshTokenRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    InviteUserRequest,
    ActivateAccountRequest,
    TokenResponse,
    AuthUserResponse,
)
from app.schemas.base import MessageResponse
from app.services.auth_service import AuthService
from app.services.audit_service import AuditService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register-company", response_model=dict, status_code=201)
async def register_company(
    data: RegisterCompanyRequest,
    db: AsyncSession = Depends(get_db),
):
    """Register a new company with an admin user account."""
    service = AuthService(db)
    company, user, tokens = await service.register_company(data)
    return {
        "message": "Company registered successfully",
        "company": {"id": company.id, "business_id": company.business_id, "name": company.name},
        "user": {"id": user.id, "business_id": user.business_id, "email": user.email, "role": user.role},
        **tokens.model_dump(),
    }


@router.post("/login", response_model=dict)
async def login(
    data: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Login and receive access + refresh tokens."""
    service = AuthService(db)
    audit = AuditService(db)
    user, tokens = await service.login(data)
    await audit.log(
        entity_type="user",
        entity_id=user.id,
        action="login",
        actor_user_id=user.id,
        company_id=user.company_id,
        entity_business_id=user.business_id,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    return {
        **tokens.model_dump(),
        "user": AuthUserResponse.model_validate(user).model_dump(),
    }


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    data: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    """Exchange refresh token for a new access token."""
    service = AuthService(db)
    return await service.refresh(data.refresh_token)


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    data: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Request a password reset token (returned in response for integration; mail it in production)."""
    service = AuthService(db)
    reset_token = await service.forgot_password(data.email)
    # In production: background_tasks.add_task(send_reset_email, data.email, reset_token)
    return MessageResponse(message="If that email exists, a reset link has been sent")


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    data: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Reset password using the reset token."""
    service = AuthService(db)
    await service.reset_password(data.token, data.new_password)
    return MessageResponse(message="Password has been reset successfully")


@router.post("/invite-user", response_model=dict)
async def invite_user(
    data: InviteUserRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Invite a user to the current company (HR/Admin only)."""
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="No company associated")
    service = AuthService(db)
    invite_token = await service.invite_user(data, current_user.company_id, current_user.id)
    return {"message": "User invited successfully", "invite_token": invite_token}


@router.post("/activate", response_model=dict)
async def activate_account(
    data: ActivateAccountRequest,
    db: AsyncSession = Depends(get_db),
):
    """Activate an invited account using the invite token."""
    service = AuthService(db)
    user = await service.activate_account(data.token, data.password)
    tokens = service._issue_tokens(user)
    return {
        "message": "Account activated successfully",
        **tokens.model_dump(),
    }


@router.get("/me", response_model=AuthUserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get the currently authenticated user profile."""
    return AuthUserResponse.model_validate(current_user)
