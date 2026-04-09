from __future__ import annotations

from typing import Any, Optional
from pydantic import EmailStr

from app.schemas.base import BaseSchema, BaseResponse
from app.utils.enums import CompanyStatus, SubscriptionPlan, SubscriptionStatus


class CompanyCreate(BaseSchema):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = "India"
    timezone: Optional[str] = "Asia/Kolkata"
    legal_name: Optional[str] = None
    employee_limit: Optional[int] = 100
    subscription_plan: SubscriptionPlan = SubscriptionPlan.FREE


class CompanyUpdate(BaseSchema):
    name: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    timezone: Optional[str] = None
    legal_name: Optional[str] = None
    logo_url: Optional[str] = None
    branding_settings: Optional[dict[str, Any]] = None
    employee_limit: Optional[int] = None


class CompanyResponse(BaseResponse):
    name: str
    slug: str
    legal_name: Optional[str] = None
    email: str
    phone: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    timezone: Optional[str] = None
    logo_url: Optional[str] = None
    employee_limit: int
    status: str
    subscription_plan: str
    subscription_status: str
    branding_settings: Optional[dict[str, Any]] = None


class CompanySummary(BaseSchema):
    id: str
    business_id: str
    name: str
    slug: str
    email: str
    status: str
    subscription_plan: str
    employee_limit: int
