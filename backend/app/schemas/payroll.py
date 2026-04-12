from __future__ import annotations

from datetime import datetime
from typing import Optional

from app.schemas.base import BaseSchema, BaseResponse
from app.utils.enums import PayrollStatus, PaymentStatus


class PayrollRunCreate(BaseSchema):
    period_month: int  # 1-12
    period_year: int
    notes: Optional[str] = None


class PayrollRunProcess(BaseSchema):
    notes: Optional[str] = None


class PayrollRunResponse(BaseResponse):
    company_id: str
    period_month: int
    period_year: int
    status: str
    processed_at: Optional[datetime] = None
    total_employees: int = 0
    total_gross: float = 0.0
    total_deductions: float = 0.0
    total_net: float = 0.0
    currency: str = "INR"
    notes: Optional[str] = None


class PayrollItemResponse(BaseResponse):
    company_id: str
    payroll_run_id: str
    employee_id: str
    employee_name: Optional[str] = None
    employee_code: Optional[str] = None
    basic_salary: float = 0.0
    gross_salary: float
    allowances: float
    deductions: float
    tax_amount: float
    total_deductions: float = 0.0
    net_salary: float
    currency: str
    payment_status: str
    payment_date: Optional[datetime] = None
