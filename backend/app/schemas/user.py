from __future__ import annotations

from datetime import datetime
from typing import Optional
from pydantic import EmailStr, field_validator

from app.schemas.base import BaseSchema, BaseResponse
from app.utils.enums import UserRole, UserStatus


class UserCreate(BaseSchema):
    email: EmailStr
    full_name: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: UserRole = UserRole.EMPLOYEE
    phone: Optional[str] = None
    password: Optional[str] = None


class UserUpdate(BaseSchema):
    full_name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    role: Optional[UserRole] = None


class UserStatusUpdate(BaseSchema):
    status: UserStatus


class UserResponse(BaseResponse):
    company_id: Optional[str] = None
    email: str
    full_name: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    role: str
    status: str
    last_login_at: Optional[datetime] = None
    avatar_url: Optional[str] = None


class UserSummary(BaseSchema):
    id: str
    business_id: str
    email: str
    full_name: str
    role: str
    status: str


class AdminResetPasswordRequest(BaseSchema):
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v
