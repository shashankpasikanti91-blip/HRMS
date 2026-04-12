from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional, Tuple

from jose import JWTError
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    InvalidCredentialsException,
    NotFoundException,
    ConflictException,
    TokenExpiredException,
    BadRequestException,
    UnauthorizedException,
)
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    create_reset_token,
    create_invite_token,
    decode_token,
)
from app.models.company import Company
from app.models.user import User
from app.schemas.auth import (
    RegisterCompanyRequest,
    RegisterRequest,
    GoogleSyncRequest,
    LoginRequest,
    TokenResponse,
    InviteUserRequest,
)
from app.services.business_id_service import BusinessIdService
from app.utils.enums import UserRole, UserStatus, CompanyStatus, SubscriptionPlan, SubscriptionStatus
from app.utils.helpers import slugify_name
import uuid


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def register_company(self, data: RegisterCompanyRequest) -> Tuple[Company, User, TokenResponse]:
        """Register a new company with an admin user."""
        # Check company email uniqueness
        company_email = data.company_email.lower()
        admin_email = data.admin_email.lower()

        existing_company = await self.db.execute(
            select(Company).where(func.lower(Company.email) == company_email, Company.is_deleted == False)
        )
        if existing_company.scalar_one_or_none():
            raise ConflictException(f"Company with email '{data.company_email}' already exists")

        # Check admin email uniqueness globally
        existing_user = await self.db.execute(
            select(User).where(func.lower(User.email) == admin_email, User.is_deleted == False)
        )
        if existing_user.scalar_one_or_none():
            raise ConflictException(f"User with email '{data.admin_email}' already exists")

        # Create company
        company_bid = await BusinessIdService.generate(self.db, "company")
        slug = slugify_name(data.company_name)
        # ensure slug uniqueness
        existing_slug = await self.db.execute(select(Company).where(Company.slug == slug))
        if existing_slug.scalar_one_or_none():
            slug = f"{slug}-{company_bid.lower()}"

        company = Company(
            id=str(uuid.uuid4()),
            business_id=company_bid,
            name=data.company_name,
            slug=slug,
            email=company_email,
            phone=data.phone,
            country=data.country,
            timezone=data.timezone,
            status=CompanyStatus.TRIAL.value,
            subscription_plan=SubscriptionPlan.FREE.value,
            subscription_status=SubscriptionStatus.TRIAL.value,
        )
        self.db.add(company)
        await self.db.flush()

        # Create admin user
        user_bid = await BusinessIdService.generate(self.db, "user")
        admin = User(
            id=str(uuid.uuid4()),
            business_id=user_bid,
            company_id=company.id,
            full_name=data.admin_full_name,
            email=admin_email,
            password_hash=hash_password(data.admin_password),
            role=UserRole.COMPANY_ADMIN.value,
            status=UserStatus.ACTIVE.value,
        )
        self.db.add(admin)
        await self.db.flush()

        # Generate tokens
        tokens = self._issue_tokens(admin)

        # Fire-and-forget: notify owner about new company onboarding
        import asyncio as _asyncio
        from app.utils.notifications import notify_owner_new_signup
        _asyncio.create_task(
            notify_owner_new_signup(
                email=admin.email,
                name=admin.full_name,
                provider="company-registration",
                product_access=["hrms"],
            )
        )
        return company, admin, tokens

    # ── Helpers ────────────────────────────────────────────────────────────────
    async def _create_personal_workspace(self, email: str, full_name: str) -> Company:
        """Create a personal workspace (company) for a self-registered user."""
        company_bid = await BusinessIdService.generate(self.db, "company")
        slug = slugify_name(full_name or email.split("@")[0])
        # ensure slug uniqueness
        existing_slug = await self.db.execute(select(Company).where(Company.slug == slug))
        if existing_slug.scalar_one_or_none():
            slug = f"{slug}-{company_bid.lower()}"
        company = Company(
            id=str(uuid.uuid4()),
            business_id=company_bid,
            name=f"{full_name or email.split('@')[0]}'s Workspace",
            slug=slug,
            email=email,
            status=CompanyStatus.TRIAL.value,
            subscription_plan=SubscriptionPlan.FREE.value,
            subscription_status=SubscriptionStatus.TRIAL.value,
        )
        self.db.add(company)
        await self.db.flush()
        return company

    # ── Self-Registration ──────────────────────────────────────────────────────

    async def register(self, data: RegisterRequest) -> Tuple[User, TokenResponse]:
        """Create a standalone user with a personal workspace."""
        # Check if email already registered globally
        normalized_email = data.email.lower()
        existing = await self.db.execute(
            select(User).where(func.lower(User.email) == normalized_email, User.is_deleted == False)
        )
        if existing.scalar_one_or_none():
            raise ConflictException(f"Email '{data.email}' is already registered")

        company = await self._create_personal_workspace(normalized_email, data.full_name)

        user_bid = await BusinessIdService.generate(self.db, "user")
        user = User(
            id=str(uuid.uuid4()),
            business_id=user_bid,
            company_id=company.id,
            full_name=data.full_name,
            email=normalized_email,
            password_hash=hash_password(data.password),
            role=UserRole.COMPANY_ADMIN.value,
            status=UserStatus.ACTIVE.value,
            provider="local",
            product_access=["recruit"],
        )
        self.db.add(user)
        await self.db.flush()
        tokens = self._issue_tokens(user)
        # Fire-and-forget: notify owner
        import asyncio as _asyncio
        from app.utils.notifications import notify_owner_new_signup
        _asyncio.create_task(
            notify_owner_new_signup(
                email=data.email,
                name=data.full_name,
                provider="local",
                product_access=["recruit"],
            )
        )
        return user, tokens

    # ── Google OAuth Sync ──────────────────────────────────────────────────────

    async def google_sync(self, data: GoogleSyncRequest) -> Tuple[User, TokenResponse]:
        """Find or create a user after successful Google OAuth, issue JWT."""
        # 1. Find by google_id
        result = await self.db.execute(
            select(User).where(User.google_id == data.google_id, User.is_deleted == False)
        )
        user = result.scalar_one_or_none()

        # 2. Find by email (link accounts)
        if not user:
            result = await self.db.execute(
                select(User).where(User.email == data.email, User.is_deleted == False)
            )
            user = result.scalar_one_or_none()

        if user:
            # Link Google account if not already linked
            if not user.google_id:
                user.google_id = data.google_id
                user.provider = "google"
            if not user.avatar_url and data.image:
                user.avatar_url = data.image
            if user.status == UserStatus.SUSPENDED.value:
                raise UnauthorizedException(detail="Account is suspended")
        else:
            # New user — create personal workspace
            company = await self._create_personal_workspace(data.email, data.name)
            user_bid = await BusinessIdService.generate(self.db, "user")
            user = User(
                id=str(uuid.uuid4()),
                business_id=user_bid,
                company_id=company.id,
                full_name=data.name or data.email.split("@")[0],
                email=data.email,
                google_id=data.google_id,
                provider="google",
                avatar_url=data.image,
                role=UserRole.COMPANY_ADMIN.value,
                status=UserStatus.ACTIVE.value,
                product_access=["recruit"],
            )
            self.db.add(user)

        user.last_login_at = datetime.now(tz=timezone.utc)
        await self.db.flush()
        tokens = self._issue_tokens(user)
        # Fire-and-forget: notify owner only for brand-new users
        import asyncio as _asyncio
        from app.utils.notifications import notify_owner_google_login
        _is_new = not bool(result.scalar_one_or_none() if False else None)  # evaluated below
        _asyncio.create_task(
            notify_owner_google_login(
                email=data.email,
                name=data.name or data.email,
                is_new=user.created_at == user.updated_at,  # freshly created
            )
        )
        return user, tokens

    # ── Google OAuth Redirect Flow (backend-driven) ────────────────────────────

    async def google_oauth_redirect(self) -> str:
        """Return the Google OAuth authorization URL."""
        from app.core.config import settings
        import urllib.parse
        if not settings.GOOGLE_CLIENT_ID:
            raise BadRequestException("Google OAuth is not configured")
        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "offline",
            "prompt": "select_account",
        }
        return "https://accounts.google.com/o/oauth2/v2/auth?" + urllib.parse.urlencode(params)

    async def google_oauth_callback(self, code: str) -> Tuple[User, TokenResponse]:
        """Exchange Google authorization code for user info and issue JWT."""
        import httpx
        from app.core.config import settings

        if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
            raise BadRequestException("Google OAuth is not configured")

        # Exchange code for tokens
        async with httpx.AsyncClient(timeout=15) as client:
            token_resp = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                    "grant_type": "authorization_code",
                },
            )
        if token_resp.status_code != 200:
            raise BadRequestException("Failed to exchange Google auth code")
        token_data = token_resp.json()
        access_token_google = token_data.get("access_token")
        if not access_token_google:
            raise BadRequestException("No access token returned from Google")

        # Get user info
        async with httpx.AsyncClient(timeout=10) as client:
            user_resp = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token_google}"},
            )
        if user_resp.status_code != 200:
            raise BadRequestException("Failed to fetch Google user info")
        info = user_resp.json()

        sync_data = GoogleSyncRequest(
            google_id=info["id"],
            email=info["email"],
            name=info.get("name") or info.get("given_name", ""),
            image=info.get("picture"),
        )
        return await self.google_sync(sync_data)

    async def login(self, data: LoginRequest) -> Tuple[User, TokenResponse]:
        """Authenticate user and return tokens."""
        normalized_email = data.email.lower()
        result = await self.db.execute(
            select(User).where(func.lower(User.email) == normalized_email, User.is_deleted == False)
        )
        user = result.scalar_one_or_none()

        if not user or not user.password_hash:
            raise InvalidCredentialsException()
        if not verify_password(data.password, user.password_hash):
            raise InvalidCredentialsException()
        if user.status == UserStatus.SUSPENDED.value:
            raise UnauthorizedException(detail="Account is suspended")
        if user.status == UserStatus.INACTIVE.value:
            raise UnauthorizedException(detail="Account is inactive")

        # Update last login
        user.last_login_at = datetime.now(tz=timezone.utc)
        await self.db.flush()

        tokens = self._issue_tokens(user)
        return user, tokens

    async def refresh(self, refresh_token: str) -> TokenResponse:
        """Issue new access token from valid refresh token."""
        try:
            payload = decode_token(refresh_token)
        except JWTError:
            raise TokenExpiredException()

        if payload.get("type") != "refresh":
            raise UnauthorizedException(detail="Invalid token type")

        user_id = payload.get("sub")
        result = await self.db.execute(
            select(User).where(User.id == user_id, User.is_deleted == False)
        )
        user = result.scalar_one_or_none()
        if not user:
            raise UnauthorizedException(detail="User not found")

        return self._issue_tokens(user)

    async def forgot_password(self, email: str) -> str:
        """Generate and return reset token (caller sends email)."""
        result = await self.db.execute(
            select(User).where(User.email == email, User.is_deleted == False)
        )
        user = result.scalar_one_or_none()
        # Always return success to prevent email enumeration
        if not user:
            return ""
        return create_reset_token(user.id)

    async def reset_password(self, token: str, new_password: str) -> None:
        """Validate reset token and update password."""
        try:
            payload = decode_token(token)
        except JWTError:
            raise BadRequestException("Invalid or expired reset token")

        if payload.get("type") != "reset":
            raise BadRequestException("Invalid token type")

        user_id = payload.get("sub")
        result = await self.db.execute(
            select(User).where(User.id == user_id, User.is_deleted == False)
        )
        user = result.scalar_one_or_none()
        if not user:
            raise NotFoundException("User not found")

        user.password_hash = hash_password(new_password)
        user.status = UserStatus.ACTIVE.value
        await self.db.flush()

    async def change_password(self, current_user: User, current_password: str, new_password: str) -> None:
        """Change the current user's password after verifying the old one."""
        if not current_user.password_hash:
            raise BadRequestException("Password change is unavailable for this account")
        if not verify_password(current_password, current_user.password_hash):
            raise BadRequestException("Current password is incorrect")

        current_user.password_hash = hash_password(new_password)
        current_user.updated_by = current_user.id
        await self.db.flush()

    async def invite_user(
        self, data: InviteUserRequest, company_id: str, invited_by: str
    ) -> str:
        """Create invited user record and return invite token."""
        # Check if user already exists in this company
        existing = await self.db.execute(
            select(User).where(
                User.email == data.email,
                User.company_id == company_id,
                User.is_deleted == False,
            )
        )
        if existing.scalar_one_or_none():
            raise ConflictException(f"User with email '{data.email}' already exists in this company")

        user_bid = await BusinessIdService.generate(self.db, "user")
        user = User(
            id=str(uuid.uuid4()),
            business_id=user_bid,
            company_id=company_id,
            full_name=data.full_name,
            email=data.email,
            role=data.role.value,
            status=UserStatus.INVITED.value,
            created_by=invited_by,
        )
        self.db.add(user)
        await self.db.flush()

        return create_invite_token(data.email, company_id, data.role.value)

    async def activate_account(self, token: str, password: str) -> User:
        """Activate an invited user account."""
        try:
            payload = decode_token(token)
        except JWTError:
            raise BadRequestException("Invalid or expired invite token")

        if payload.get("type") != "invite":
            raise BadRequestException("Invalid token type")

        email = payload.get("sub")
        company_id = payload.get("company_id")

        result = await self.db.execute(
            select(User).where(
                User.email == email,
                User.company_id == company_id,
                User.is_deleted == False,
            )
        )
        user = result.scalar_one_or_none()
        if not user:
            raise NotFoundException("User not found or already activated")

        user.password_hash = hash_password(password)
        user.status = UserStatus.ACTIVE.value
        await self.db.flush()
        return user

    def _issue_tokens(self, user: User) -> TokenResponse:
        from app.core.config import settings
        extra = {
            "company_id": user.company_id,
            "role": user.role,
            "email": user.email,
        }
        access_token = create_access_token(user.id, extra_data=extra)
        refresh_token = create_refresh_token(user.id)
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )
