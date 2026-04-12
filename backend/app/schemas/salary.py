"""Schemas for salary structures, components, and employee salaries."""
from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field


# ── Salary Structure ──────────────────────────────────────────────────────

class SalaryStructureCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    code: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    currency: str = Field("INR", max_length=10)
    is_default: bool = False
    payroll_cycle: str = "monthly"


class SalaryStructureUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    code: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    currency: Optional[str] = Field(None, max_length=10)
    is_default: Optional[bool] = None
    payroll_cycle: Optional[str] = None


class SalaryStructureResponse(BaseModel):
    business_id: str
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    currency: str = "INR"
    is_default: bool = False
    payroll_cycle: str = "monthly"
    is_active: bool = True
    components: Optional[list["SalaryComponentResponse"]] = None


# ── Salary Component ─────────────────────────────────────────────────────

class SalaryComponentCreate(BaseModel):
    salary_structure_id: str
    name: str = Field(..., min_length=1, max_length=255)
    code: str = Field(..., min_length=1, max_length=50)
    component_type: str  # earning, deduction, employer_contribution, etc.
    calculation_type: str = "fixed"  # fixed, percentage_of_basic, etc.
    amount: Optional[float] = Field(None, ge=0)
    percentage: Optional[float] = Field(None, ge=0, le=100)
    formula: Optional[str] = None
    is_taxable: bool = True
    is_mandatory: bool = False
    priority: int = Field(100, ge=1)
    max_amount: Optional[float] = Field(None, ge=0)
    min_amount: Optional[float] = Field(None, ge=0)
    description: Optional[str] = None


class SalaryComponentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    component_type: Optional[str] = None
    calculation_type: Optional[str] = None
    amount: Optional[float] = Field(None, ge=0)
    percentage: Optional[float] = Field(None, ge=0, le=100)
    formula: Optional[str] = None
    is_taxable: Optional[bool] = None
    is_mandatory: Optional[bool] = None
    priority: Optional[int] = Field(None, ge=1)
    max_amount: Optional[float] = None
    min_amount: Optional[float] = None
    description: Optional[str] = None


class SalaryComponentResponse(BaseModel):
    business_id: str
    salary_structure_id: str
    name: str
    code: str
    component_type: str
    calculation_type: str = "fixed"
    amount: Optional[float] = None
    percentage: Optional[float] = None
    formula: Optional[str] = None
    is_taxable: bool = True
    is_mandatory: bool = False
    priority: int = 100
    max_amount: Optional[float] = None
    min_amount: Optional[float] = None
    description: Optional[str] = None
    is_active: bool = True


# ── Employee Salary ───────────────────────────────────────────────────────

class EmployeeSalaryCreate(BaseModel):
    employee_id: str
    salary_structure_id: str
    ctc: float = Field(..., ge=0)
    basic_salary: float = Field(..., ge=0)
    gross_salary: float = Field(0, ge=0)
    net_salary: float = Field(0, ge=0)
    currency: str = Field("INR", max_length=10)
    component_overrides: Optional[dict[str, Any]] = None
    effective_from: Optional[str] = None


class EmployeeSalaryUpdate(BaseModel):
    salary_structure_id: Optional[str] = None
    ctc: Optional[float] = Field(None, ge=0)
    basic_salary: Optional[float] = Field(None, ge=0)
    gross_salary: Optional[float] = Field(None, ge=0)
    net_salary: Optional[float] = Field(None, ge=0)
    currency: Optional[str] = Field(None, max_length=10)
    component_overrides: Optional[dict[str, Any]] = None
    effective_from: Optional[str] = None


class EmployeeSalaryResponse(BaseModel):
    business_id: str
    employee_id: str
    salary_structure_id: str
    ctc: float = 0
    basic_salary: float = 0
    gross_salary: float = 0
    net_salary: float = 0
    currency: str = "INR"
    component_overrides: Optional[dict[str, Any]] = None
    effective_from: Optional[str] = None
    is_active: bool = True


# ── Shift ─────────────────────────────────────────────────────────────────

class ShiftCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    code: Optional[str] = Field(None, max_length=50)
    shift_type: str = "general"
    start_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    end_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    break_duration_minutes: int = Field(60, ge=0)
    work_hours: float = Field(8.0, ge=0)
    is_night_shift: bool = False
    grace_minutes: int = Field(15, ge=0)
    is_default: bool = False
    applicable_days: Optional[list[int]] = None


class ShiftUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    code: Optional[str] = Field(None, max_length=50)
    shift_type: Optional[str] = None
    start_time: Optional[str] = Field(None, pattern=r"^\d{2}:\d{2}$")
    end_time: Optional[str] = Field(None, pattern=r"^\d{2}:\d{2}$")
    break_duration_minutes: Optional[int] = Field(None, ge=0)
    work_hours: Optional[float] = Field(None, ge=0)
    is_night_shift: Optional[bool] = None
    grace_minutes: Optional[int] = Field(None, ge=0)
    is_default: Optional[bool] = None
    applicable_days: Optional[list[int]] = None


class ShiftResponse(BaseModel):
    business_id: str
    name: str
    code: Optional[str] = None
    shift_type: str = "general"
    start_time: str
    end_time: str
    break_duration_minutes: int = 60
    work_hours: float = 8.0
    is_night_shift: bool = False
    grace_minutes: int = 15
    is_default: bool = False
    applicable_days: Optional[list[int]] = None
    is_active: bool = True


# Update forward references
SalaryStructureResponse.model_rebuild()
