"""Salary structures, components, and tax rules for the payroll engine."""
from __future__ import annotations

from typing import Any, Optional

from sqlalchemy import String, ForeignKey, Integer, Float, Text, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class SalaryStructure(BaseModel):
    """Reusable salary structure template per organization."""
    __tablename__ = "salary_structures"

    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    payroll_cycle: Mapped[str] = mapped_column(String(30), default="monthly", nullable=False)

    __table_args__ = (
        __import__("sqlalchemy").UniqueConstraint("company_id", "name", name="uq_salary_structure_name"),
    )


class SalaryComponent(BaseModel):
    """Individual salary component (earning/deduction/benefit) within a structure."""
    __tablename__ = "salary_components"

    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    salary_structure_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("salary_structures.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    component_type: Mapped[str] = mapped_column(String(30), nullable=False)  # earning, deduction, etc.
    calculation_type: Mapped[str] = mapped_column(String(30), default="fixed", nullable=False)
    amount: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # fixed amount
    percentage: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # percentage value
    formula: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)  # custom formula
    is_taxable: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_mandatory: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    priority: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    max_amount: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    min_amount: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    __table_args__ = (
        __import__("sqlalchemy").UniqueConstraint(
            "salary_structure_id", "code", name="uq_salary_component_code_structure"
        ),
    )


class EmployeeSalary(BaseModel):
    """Employee-specific salary assignment linking to a salary structure."""
    __tablename__ = "employee_salaries"

    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    employee_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True
    )
    salary_structure_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("salary_structures.id", ondelete="CASCADE"), nullable=False, index=True
    )
    ctc: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    basic_salary: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    gross_salary: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    net_salary: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    component_overrides: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON, nullable=True)
    effective_from: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)  # YYYY-MM-DD

    __table_args__ = (
        __import__("sqlalchemy").UniqueConstraint("employee_id", name="uq_employee_salary"),
    )


class TaxRule(BaseModel):
    """Tax rules per country/state/company level."""
    __tablename__ = "tax_rules"

    country_code: Mapped[Optional[str]] = mapped_column(String(10), nullable=True, index=True)
    state_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, index=True)
    company_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=True, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tax_type: Mapped[str] = mapped_column(String(50), nullable=False)  # income_tax, social_security, etc.
    slabs: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # flat rate as decimal
    max_amount: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    employer_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    employee_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    effective_year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    rules_config: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON, nullable=True)
