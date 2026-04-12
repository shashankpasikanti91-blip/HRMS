from __future__ import annotations

from datetime import date
from typing import Optional

from sqlalchemy import String, ForeignKey, Date, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.utils.enums import EmploymentType, WorkMode, EmploymentStatus, Gender


class Department(BaseModel):
    __tablename__ = "departments"

    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    head_employee_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True
    )
    parent_department_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True
    )

    # ── Relationships ──────────────────────────────────────────────────────
    company: Mapped["Company"] = relationship("Company", back_populates="departments", lazy="noload")  # type: ignore[name-defined]
    employees: Mapped[list["Employee"]] = relationship(
        "Employee", foreign_keys="Employee.department_id", back_populates="department", lazy="noload"
    )
    head_employee: Mapped[Optional["Employee"]] = relationship(
        "Employee", foreign_keys=[head_employee_id], lazy="noload"
    )
    children: Mapped[list["Department"]] = relationship(
        "Department", foreign_keys=[parent_department_id], back_populates="parent", lazy="noload"
    )
    parent: Mapped[Optional["Department"]] = relationship(
        "Department", foreign_keys=[parent_department_id], back_populates="children", remote_side="Department.id", lazy="noload"
    )


class Employee(BaseModel):
    __tablename__ = "employees"

    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    employee_code: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    first_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    last_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    work_email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    personal_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    emergency_contact_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    emergency_contact_phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    gender: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    date_of_birth: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    joining_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True, index=True)
    employment_type: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    work_mode: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    department_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True, index=True
    )
    designation: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    manager_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True
    )
    employment_status: Mapped[str] = mapped_column(
        String(30), default=EmploymentStatus.ACTIVE.value, nullable=False, index=True
    )
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    shift_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    payroll_group_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    profile_photo_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    documents_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Visa / Immigration fields
    visa_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    visa_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    visa_expiry_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True, index=True)
    passport_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    passport_expiry_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    nationality: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Address
    address_line_1: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    address_line_2: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    postal_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    # Bank details
    bank_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    bank_account_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    bank_ifsc_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    bank_branch: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Branch / Designation references
    branch_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("branches.id", ondelete="SET NULL"), nullable=True
    )
    designation_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("designations.id", ondelete="SET NULL"), nullable=True
    )

    __table_args__ = (
        __import__("sqlalchemy").UniqueConstraint("employee_code", "company_id", name="uq_employee_code_company"),
        __import__("sqlalchemy").UniqueConstraint("work_email", "company_id", name="uq_employee_email_company"),
    )

    # ── Relationships ──────────────────────────────────────────────────────
    company: Mapped["Company"] = relationship("Company", back_populates="employees", lazy="noload")  # type: ignore[name-defined]
    user: Mapped[Optional["User"]] = relationship("User", back_populates="employee", lazy="noload")  # type: ignore[name-defined]
    department: Mapped[Optional["Department"]] = relationship(
        "Department", foreign_keys=[department_id], back_populates="employees", lazy="noload"
    )
    manager: Mapped[Optional["Employee"]] = relationship(
        "Employee", foreign_keys=[manager_id], remote_side="Employee.id", lazy="noload"
    )
    direct_reports: Mapped[list["Employee"]] = relationship(
        "Employee", foreign_keys=[manager_id], back_populates="manager", lazy="noload"
    )
    attendance_records: Mapped[list["Attendance"]] = relationship(  # type: ignore[name-defined]
        "Attendance", back_populates="employee", lazy="noload"
    )
    leave_requests: Mapped[list["LeaveRequest"]] = relationship(  # type: ignore[name-defined]
        "LeaveRequest", foreign_keys="LeaveRequest.employee_id", back_populates="employee", lazy="noload"
    )
