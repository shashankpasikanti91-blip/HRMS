from __future__ import annotations

from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import (
    TokenExpiredException,
    UnauthorizedException,
    InsufficientPermissionsException,
    TenantIsolationException,
)
from app.core.security import decode_token
from app.models.user import User, TokenBlacklist
from app.utils.enums import UserRole

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not credentials:
        raise UnauthorizedException("Authorization header missing")

    try:
        payload = decode_token(credentials.credentials)
    except JWTError:
        raise TokenExpiredException()

    if payload.get("type") != "access":
        raise UnauthorizedException("Invalid token type")

    # Check token blacklist (revoked tokens)
    jti = payload.get("jti")
    if jti:
        blacklisted = await db.execute(
            select(TokenBlacklist.id).where(TokenBlacklist.jti == jti)
        )
        if blacklisted.scalar_one_or_none():
            raise UnauthorizedException("Token has been revoked")

    user_id: str = payload.get("sub", "")
    result = await db.execute(
        select(User).where(User.id == user_id, User.is_deleted == False)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise UnauthorizedException("User not found")
    if user.status not in ("active",):
        raise UnauthorizedException("Account is not active")

    return user


async def get_current_active_company_id(
    current_user: User = Depends(get_current_user),
) -> Optional[str]:
    if current_user.role == UserRole.SUPER_ADMIN.value:
        return None  # super admin has no single company
    return current_user.company_id


def require_roles(*roles: UserRole):
    """Dependency factory – requires one of the given roles."""

    async def _checker(current_user: User = Depends(get_current_user)) -> User:
        role_values = {r.value if isinstance(r, UserRole) else r for r in roles}
        if current_user.role not in role_values:
            raise InsufficientPermissionsException([r.value if isinstance(r, UserRole) else r for r in roles])
        return current_user

    return _checker


def require_super_admin():
    return require_roles(UserRole.SUPER_ADMIN)


def require_company_admin_or_above():
    return require_roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)


def require_hr_or_above():
    return require_roles(
        UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER
    )


def require_recruiter_or_above():
    return require_roles(
        UserRole.SUPER_ADMIN,
        UserRole.COMPANY_ADMIN,
        UserRole.HR_MANAGER,
        UserRole.RECRUITER,
    )


def require_manager_or_above():
    return require_roles(
        UserRole.SUPER_ADMIN,
        UserRole.COMPANY_ADMIN,
        UserRole.HR_MANAGER,
        UserRole.TEAM_MANAGER,
    )


def get_tenant_company_id(
    current_user: User = Depends(get_current_user),
) -> str:
    """Return the company_id for the current user, enforcing tenant isolation."""
    if current_user.role == UserRole.SUPER_ADMIN.value:
        # Super admin must supply company_id in query/path
        return ""
    if not current_user.company_id:
        raise UnauthorizedException("User has no associated company")
    return current_user.company_id


def assert_same_tenant(resource_company_id: str, current_user: User) -> None:
    """Raise ForbiddenException if user is trying to access another tenant's data."""
    if current_user.role == UserRole.SUPER_ADMIN.value:
        return
    if current_user.company_id != resource_company_id:
        raise TenantIsolationException()
