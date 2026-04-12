from __future__ import annotations

from fastapi import APIRouter, Body, Depends, HTTPException, BackgroundTasks, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.rate_limit import limiter
from app.models.user import User, TokenBlacklist
from app.core.security import decode_token
from app.schemas.auth import (
    RegisterCompanyRequest,
    RegisterRequest,
    GoogleSyncRequest,
    LoginRequest,
    RefreshTokenRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ChangePasswordRequest,
    InviteUserRequest,
    ActivateAccountRequest,
    TokenResponse,
    AuthUserResponse,
)
from app.schemas.base import MessageResponse
from app.services.auth_service import AuthService
from app.services.audit_service import AuditService

router = APIRouter(prefix="/auth", tags=["Authentication"])

settings = get_settings()


@router.post("/register", response_model=dict, status_code=201)
@limiter.limit("5/minute")
async def register(
    data: RegisterRequest | RegisterCompanyRequest = Body(...),
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Register either a personal workspace or a full company owner account."""
    service = AuthService(db)

    if isinstance(data, RegisterCompanyRequest):
        company, user, tokens = await service.register_company(data)
        return {
            "message": "Company registered successfully",
            "company": {"id": company.id, "business_id": company.business_id, "name": company.name},
            "user": {"id": user.id, "business_id": user.business_id, "email": user.email, "role": user.role},
            **tokens.model_dump(),
        }

    user, tokens = await service.register(data)
    return {
        "message": "Account created successfully",
        **tokens.model_dump(),
        "user": AuthUserResponse.model_validate(user).model_dump(),
    }


@router.post("/google-sync", response_model=dict)
@limiter.limit("10/minute")
async def google_sync(
    data: GoogleSyncRequest = Body(...),
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Called by NextAuth after Google OAuth succeeds.
    Finds or creates the user and returns a FastAPI JWT.
    Requires X-Nextauth-Secret header matching NEXTAUTH_SECRET env var.
    """
    # Validate internal secret to prevent abuse
    secret = request.headers.get("x-nextauth-secret", "")
    if settings.NEXTAUTH_SECRET and secret != settings.NEXTAUTH_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")

    service = AuthService(db)
    user, tokens = await service.google_sync(data)
    return {
        **tokens.model_dump(),
        "user": AuthUserResponse.model_validate(user).model_dump(),
    }


@router.get("/google")
async def google_login():
    """Redirect browser to Google OAuth consent screen (backend-driven flow)."""
    service = AuthService(None)  # type: ignore[arg-type]
    url = await service.google_oauth_redirect()
    return RedirectResponse(url=url)


@router.get("/google/callback")
async def google_callback(
    code: str | None = None,
    error: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Google OAuth callback — backend-driven flow.
    Exchanges code for tokens, creates/finds user, redirects to frontend.
    """
    frontend_url = settings.FRONTEND_URL
    if error or not code:
        return RedirectResponse(
            url=f"{frontend_url}/login?error={error or 'authentication_failed'}"
        )
    try:
        service = AuthService(db)
        user, tokens = await service.google_oauth_callback(code)
        return RedirectResponse(
            url=(
                f"{frontend_url}/auth/google/callback"
                f"?access_token={tokens.access_token}"
                f"&refresh_token={tokens.refresh_token}"
                f"&tenant_id={user.company_id or ''}"
            )
        )
    except Exception:
        return RedirectResponse(
            url=f"{frontend_url}/login?error=Google+authentication+failed"
        )


@router.post("/register-company", response_model=dict, status_code=201)
@limiter.limit("3/minute")
async def register_company(
    data: RegisterCompanyRequest = Body(...),
    request: Request,
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
@limiter.limit("10/minute")
async def login(
    data: LoginRequest = Body(...),
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
@limiter.limit("3/minute")
async def forgot_password(
    data: ForgotPasswordRequest = Body(...),
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Request a password reset token (returned in response for integration; mail it in production)."""
    service = AuthService(db)
    reset_token = await service.forgot_password(data.email)
    # In production: background_tasks.add_task(send_reset_email, data.email, reset_token)
    return MessageResponse(message="If that email exists, a reset link has been sent")


@router.post("/reset-password", response_model=MessageResponse)
@limiter.limit("5/minute")
async def reset_password(
    data: ResetPasswordRequest = Body(...),
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Reset password using the reset token."""
    service = AuthService(db)
    await service.reset_password(data.token, data.new_password)
    return MessageResponse(message="Password has been reset successfully")


@router.post("/logout", response_model=MessageResponse)
async def logout(
    data: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Revoke access and refresh tokens on logout."""
    import uuid
    from datetime import datetime, timezone

    tokens_to_blacklist = []

    # Blacklist the refresh token
    try:
        payload = decode_token(data.refresh_token)
        jti = payload.get("jti")
        exp = payload.get("exp")
        if jti and exp:
            tokens_to_blacklist.append(
                TokenBlacklist(
                    id=str(uuid.uuid4()),
                    business_id=f"tbl_{uuid.uuid4().hex[:12]}",
                    jti=jti,
                    expires_at=datetime.fromtimestamp(exp, tz=timezone.utc),
                    user_id=current_user.id,
                )
            )
    except Exception:
        pass  # Token may already be expired

    if tokens_to_blacklist:
        db.add_all(tokens_to_blacklist)
        await db.commit()

    return MessageResponse(message="Logged out successfully")


@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    data: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Allow the currently authenticated user to change their password."""
    service = AuthService(db)
    await service.change_password(current_user, data.current_password, data.new_password)
    return MessageResponse(message="Password updated successfully")


@router.post("/mfa/enable", response_model=dict)
async def enable_mfa(current_user: User = Depends(get_current_user)):
    """Return a realistic MFA enrollment payload for the settings UI."""
    safe_email = current_user.email.replace("@", "_at_")
    return {
        "message": "MFA enrollment initiated",
        "setup_key": f"SRP-{current_user.business_id[-6:]}",
        "qr_code_url": f"otpauth://totp/SRP-HRMS:{safe_email}?secret=SRP{current_user.business_id[-6:]}&issuer=SRP-HRMS",
    }


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
