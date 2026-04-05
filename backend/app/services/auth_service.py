from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional, Tuple

from jose import JWTError
from sqlalchemy import select
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
        existing_company = await self.db.execute(
            select(Company).where(Company.email == data.company_email, Company.is_deleted == False)
        )
        if existing_company.scalar_one_or_none():
            raise ConflictException(f"Company with email '{data.company_email}' already exists")

        # Check admin email uniqueness globally
        existing_user = await self.db.execute(
            select(User).where(User.email == data.admin_email, User.is_deleted == False)
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
            email=data.company_email,
            phone=data.phone,
            country=data.country,
            timezone=data.timezone,
            status=CompanyStatus.TRIAL.value,
            subscription_plan=SubscriptionPlan.TRIAL.value,
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
            email=data.admin_email,
            password_hash=hash_password(data.admin_password),
            role=UserRole.COMPANY_ADMIN.value,
            status=UserStatus.ACTIVE.value,
        )
        self.db.add(admin)
        await self.db.flush()

        # Generate tokens
        tokens = self._issue_tokens(admin)
        return company, admin, tokens

    async def login(self, data: LoginRequest) -> Tuple[User, TokenResponse]:
        """Authenticate user and return tokens."""
        result = await self.db.execute(
            select(User).where(User.email == data.email, User.is_deleted == False)
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
