# Models package – import everything so Alembic can discover tables.
from app.models.base import BaseModel
from app.models.company import Company
from app.models.user import User, TokenBlacklist
from app.models.employee import Employee, Department
from app.models.attendance import Attendance, LeaveRequest, Holiday
from app.models.recruitment import JobPosting, Candidate, Application
from app.models.interview import Interview, Offer
from app.models.payroll import PayrollRun, PayrollItem
from app.models.performance import PerformanceReview
from app.models.notification import Document, Notification
from app.models.audit_log import AuditLog
from app.models.organization import Branch, Designation, OrganizationSettings
from app.models.policy import (
    CountryConfig, StateConfig, LeavePolicy, LeaveType, LeaveBalance,
    AttendancePolicy,
)
from app.models.salary import (
    SalaryStructure, SalaryComponent, EmployeeSalary, TaxRule,
)
from app.models.shift import Shift
from app.models.client import Client, ClientProject, EmployeeAssignment
from app.models.telegram import TelegramLink, TelegramCommandLog

__all__ = [
    "BaseModel",
    "Company",
    "User",
    "TokenBlacklist",
    "Employee",
    "Department",
    "Attendance",
    "LeaveRequest",
    "Holiday",
    "JobPosting",
    "Candidate",
    "Application",
    "Interview",
    "Offer",
    "PayrollRun",
    "PayrollItem",
    "PerformanceReview",
    "Document",
    "Notification",
    "AuditLog",
    "Branch",
    "Designation",
    "OrganizationSettings",
    "CountryConfig",
    "StateConfig",
    "LeavePolicy",
    "LeaveType",
    "LeaveBalance",
    "AttendancePolicy",
    "SalaryStructure",
    "SalaryComponent",
    "EmployeeSalary",
    "TaxRule",
    "Shift",
    "Client",
    "ClientProject",
    "EmployeeAssignment",
    "TelegramLink",
    "TelegramCommandLog",
]
