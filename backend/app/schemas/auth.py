from __future__ import annotations

from typing import Optional
from pydantic import EmailStr, field_validator, model_validator

from app.schemas.base import BaseSchema, BaseResponse
from app.utils.enums import UserRole


# ── Auth ───────────────────────────────────────────────────────────────────

class RegisterCompanyRequest(BaseSchema):
    company_name: str
    company_email: EmailStr
    admin_full_name: str
    admin_email: EmailStr
    admin_password: str
    phone: Optional[str] = None
    country: Optional[str] = "India"
    timezone: Optional[str] = "Asia/Kolkata"

    @field_validator("admin_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class LoginRequest(BaseSchema):
    email: EmailStr
    password: str


class RefreshTokenRequest(BaseSchema):
    refresh_token: str


class ForgotPasswordRequest(BaseSchema):
    email: EmailStr


class ResetPasswordRequest(BaseSchema):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class InviteUserRequest(BaseSchema):
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.EMPLOYEE


class ActivateAccountRequest(BaseSchema):
    token: str
    password: str


class TokenResponse(BaseSchema):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class AuthUserResponse(BaseResponse):
    email: str
    full_name: str
    role: str
    status: str
    company_id: Optional[str] = None
    avatar_url: Optional[str] = None
