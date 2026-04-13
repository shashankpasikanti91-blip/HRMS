"""
Seed script — creates demo data for a fresh SRP HRMS database.

Usage:
    python seed.py

Requirements:
    - DATABASE_URL set in .env (or environment)
    - Tables already created via 'alembic upgrade head'
"""
from __future__ import annotations

import asyncio
import sys
import os

# Make sure the app package is importable from here
sys.path.insert(0, os.path.dirname(__file__))

import structlog
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy import select

from app.core.config import get_settings
from app.core.security import hash_password
from app.utils.enums import (
    UserRole,
    UserStatus,
    CompanyStatus,
    SubscriptionPlan,
    SubscriptionStatus,
    EmploymentType,
    WorkMode,
    EmploymentStatus,
    ApplicationStage,
    AIScreeningStatus,
)

settings = get_settings()
logger = structlog.get_logger(__name__)


# ── Helpers ──────────────────────────────────────────────────────────────────

def _bid(prefix: str, n: int) -> str:
    return f"{prefix}-{n:06d}"


async def _upsert_company(session: AsyncSession) -> str:
    """Return demo company id (insert if not exists)."""
    from app.models.company import Company

    result = await session.execute(select(Company).where(Company.slug == "acme-corp"))
    company = result.scalar_one_or_none()
    if company:
        logger.info("company_exists", company_id=company.id)
        return company.id

    import uuid
    cid = str(uuid.uuid4())
    company = Company(
        id=cid,
        business_id=_bid("COMP", 1),
        name="Acme Corporation",
        slug="acme-corp",
        email="admin@acme.com",
        phone="+1-555-0100",
        country="US",
        status=CompanyStatus.ACTIVE.value,
        subscription_plan=SubscriptionPlan.PROFESSIONAL.value,
        subscription_status=SubscriptionStatus.ACTIVE.value,
        employee_limit=500,
    )
    session.add(company)
    await session.flush()
    logger.info("company_created", company_id=cid)
    return cid


async def _upsert_super_admin(session: AsyncSession) -> str:
    """Create super-admin user."""
    from app.models.user import User

    result = await session.execute(
        select(User).where(User.email == settings.effective_super_admin_email)
    )
    user = result.scalar_one_or_none()
    if user:
        logger.info("super_admin_exists")
        return user.id

    import uuid
    uid = str(uuid.uuid4())
    user = User(
        id=uid,
        business_id=_bid("USR", 1),
        email=settings.effective_super_admin_email,
        password_hash=hash_password(settings.effective_super_admin_password),
        full_name="Super Admin",
        first_name="Super",
        last_name="Admin",
        role=UserRole.SUPER_ADMIN.value,
        status=UserStatus.ACTIVE.value,
        company_id=None,
    )
    session.add(user)
    await session.flush()
    logger.info("super_admin_created", user_id=uid)
    return uid


async def _upsert_company_admin(session: AsyncSession, company_id: str) -> str:
    from app.models.user import User

    # Check by business_id first (handles existing DB state)
    bid = _bid("USR", 2)
    result = await session.execute(select(User).where(User.business_id == bid))
    user = result.scalar_one_or_none()
    if user:
        return user.id

    # Also check by email
    EMAIL = "hr@acme.com"
    result = await session.execute(
        select(User).where(User.email == EMAIL, User.company_id == company_id)
    )
    user = result.scalar_one_or_none()
    if user:
        return user.id

    # Check for any company_admin for this company
    result = await session.execute(
        select(User).where(
            User.company_id == company_id,
            User.role.in_([UserRole.COMPANY_ADMIN.value, UserRole.HR_MANAGER.value]),
        )
    )
    user = result.scalars().first()
    if user:
        return user.id

    import uuid
    uid = str(uuid.uuid4())
    user = User(
        id=uid,
        business_id=bid,
        email=EMAIL,
        password_hash=hash_password("Admin@1234"),
        full_name="Jane HR",
        first_name="Jane",
        last_name="HR",
        role=UserRole.HR_MANAGER.value,
        status=UserStatus.ACTIVE.value,
        company_id=company_id,
    )
    session.add(user)
    await session.flush()
    logger.info("company_admin_created", user_id=uid)
    return uid


async def _seed_departments(session: AsyncSession, company_id: str, created_by: str) -> dict[str, str]:
    from app.models.employee import Department

    depts = [
        ("Engineering", "ENG"),
        ("Human Resources", "HR"),
        ("Marketing", "MKT"),
        ("Finance", "FIN"),
        ("Sales", "SLS"),
    ]
    result = {}
    for i, (name, code) in enumerate(depts, 1):
        r = await session.execute(
            select(Department).where(
                Department.company_id == company_id,
                Department.name == name,
            )
        )
        dept = r.scalar_one_or_none()
        if not dept:
            import uuid
            dept = Department(
                id=str(uuid.uuid4()),
                business_id=_bid("DEPT", i),
                name=name,
                code=code,
                company_id=company_id,
                created_by=created_by,
                updated_by=created_by,
            )
            session.add(dept)
            await session.flush()
        result[code] = dept.id
    logger.info("departments_seeded", count=len(result))
    return result


async def _seed_employees(
    session: AsyncSession,
    company_id: str,
    created_by: str,
    dept_map: dict[str, str],
) -> list[str]:
    from app.models.employee import Employee
    from app.models.user import User

    emp_data = [
        ("alice@acme.com", "Alice", "Johnson", "Software Engineer", "ENG", "EMP-000001"),
        ("bob@acme.com", "Bob", "Smith", "HR Specialist", "HR", "EMP-000002"),
        ("carol@acme.com", "Carol", "White", "Marketing Manager", "MKT", "EMP-000003"),
        ("dave@acme.com", "Dave", "Brown", "Financial Analyst", "FIN", "EMP-000004"),
        ("eve@acme.com", "Eve", "Davis", "Sales Executive", "SLS", "EMP-000005"),
    ]

    emp_ids = []
    for i, (email, fname, lname, designation, dept_code, emp_bid) in enumerate(emp_data, 3):
        r = await session.execute(
            select(User).where(User.email == email, User.company_id == company_id)
        )
        user = r.scalar_one_or_none()
        # Bob is a team_manager; everyone else is employee
        role = UserRole.TEAM_MANAGER.value if email == "bob@acme.com" else UserRole.EMPLOYEE.value
        if not user:
            import uuid
            uid = str(uuid.uuid4())
            user = User(
                id=uid,
                business_id=_bid("USR", i),
                email=email,
                password_hash=hash_password("Employee@1234"),
                full_name=f"{fname} {lname}",
                first_name=fname,
                last_name=lname,
                role=role,
                status=UserStatus.ACTIVE.value,
                company_id=company_id,
            )
            session.add(user)
            await session.flush()
        elif user.role != role:
            user.role = role
            await session.flush()

        r2 = await session.execute(
            select(Employee).where(Employee.company_id == company_id, Employee.business_id == emp_bid)
        )
        emp = r2.scalar_one_or_none()
        if not emp:
            import uuid
            from datetime import date
            emp = Employee(
                id=str(uuid.uuid4()),
                business_id=emp_bid,
                employee_code=emp_bid,
                company_id=company_id,
                user_id=user.id,
                full_name=f"{fname} {lname}",
                first_name=fname,
                last_name=lname,
                work_email=email,
                designation=designation,
                department_id=dept_map[dept_code],
                employment_type=EmploymentType.FULL_TIME.value,
                work_mode=WorkMode.HYBRID.value,
                employment_status=EmploymentStatus.ACTIVE.value,
                joining_date=date(2023, 1, 15),
                documents_count=0,
                created_by=created_by,
                updated_by=created_by,
            )
            session.add(emp)
            await session.flush()

        emp_ids.append(emp.id)

    logger.info("employees_seeded", count=len(emp_ids))
    return emp_ids


async def _seed_jobs(
    session: AsyncSession,
    company_id: str,
    created_by: str,
    dept_map: dict[str, str],
) -> list[str]:
    from app.models.recruitment import JobPosting

    job_data = [
        ("Senior Backend Engineer", "ENG", "JOB-000001"),
        ("UX Designer", "MKT", "JOB-000002"),
        ("Data Analyst", "FIN", "JOB-000003"),
    ]

    job_ids = []
    for title, dept_code, bid in job_data:
        r = await session.execute(
            select(JobPosting).where(JobPosting.business_id == bid)
        )
        job = r.scalar_one_or_none()
        if not job:
            import uuid
            job = JobPosting(
                id=str(uuid.uuid4()),
                business_id=bid,
                company_id=company_id,
                title=title,
                department_id=dept_map[dept_code],
                employment_type=EmploymentType.FULL_TIME.value,
                location="Remote",
                description=f"We are looking for a talented {title} to join our team.",
                requirements="3+ years experience, strong communication skills.",
                salary_min=60000.0,
                salary_max=120000.0,
                created_by=created_by,
                updated_by=created_by,
            )
            session.add(job)
            await session.flush()
        job_ids.append(job.id)

    logger.info("jobs_seeded", count=len(job_ids))
    return job_ids


async def _seed_candidates(session: AsyncSession, company_id: str, created_by: str) -> list[str]:
    from app.models.recruitment import Candidate

    cand_data = [
        ("frank@example.com", "Frank", "Miller", "CAND-000001"),
        ("grace@example.com", "Grace", "Lee", "CAND-000002"),
        ("henry@example.com", "Henry", "Clark", "CAND-000003"),
    ]

    cand_ids = []
    for email, fname, lname, bid in cand_data:
        r = await session.execute(
            select(Candidate).where(Candidate.business_id == bid)
        )
        cand = r.scalar_one_or_none()
        if not cand:
            import uuid
            cand = Candidate(
                id=str(uuid.uuid4()),
                business_id=bid,
                company_id=company_id,
                email=email,
                full_name=f"{fname} {lname}",
                first_name=fname,
                last_name=lname,
                phone="+1-555-0200",
                current_role="Software Developer",
                years_of_experience=4,
                created_by=created_by,
                updated_by=created_by,
            )
            session.add(cand)
            await session.flush()
        cand_ids.append(cand.id)

    logger.info("candidates_seeded", count=len(cand_ids))
    return cand_ids


# ── Main ─────────────────────────────────────────────────────────────────────

async def _seed_country_configs(session: AsyncSession, created_by: str) -> None:
    """Seed global country configs for the policy engine."""
    import uuid
    from app.models.policy import CountryConfig

    countries = [
        {
            "country_code": "IN", "country_name": "India",
            "currency_code": "INR", "currency_symbol": "₹",
            "date_format": "DD/MM/YYYY", "timezone": "Asia/Kolkata",
            "default_weekend_days": [6],  # Only Sunday
            "default_work_hours": 8.0, "minimum_wage": 21000,
            "tax_framework": {
                "income_tax": "new_regime_2024",
                "pf_rate_employee": 0.12, "pf_rate_employer": 0.12,
                "esi_threshold": 21000, "esi_rate_employee": 0.0075, "esi_rate_employer": 0.0325,
                "professional_tax": True,
            },
        },
        {
            "country_code": "US", "country_name": "United States",
            "currency_code": "USD", "currency_symbol": "$",
            "date_format": "MM/DD/YYYY", "timezone": "America/New_York",
            "default_weekend_days": [5, 6],
            "default_work_hours": 8.0, "minimum_wage": 7.25,
            "tax_framework": {
                "federal_income_tax": True, "state_income_tax": True,
                "social_security_rate": 0.062, "medicare_rate": 0.0145,
            },
        },
        {
            "country_code": "GB", "country_name": "United Kingdom",
            "currency_code": "GBP", "currency_symbol": "£",
            "date_format": "DD/MM/YYYY", "timezone": "Europe/London",
            "default_weekend_days": [5, 6],
            "default_work_hours": 7.5, "minimum_wage": 11.44,
            "tax_framework": {
                "income_tax": True, "national_insurance": True,
                "pension_auto_enrol_rate": 0.05,
            },
        },
        {
            "country_code": "AE", "country_name": "United Arab Emirates",
            "currency_code": "AED", "currency_symbol": "د.إ",
            "date_format": "DD/MM/YYYY", "timezone": "Asia/Dubai",
            "default_weekend_days": [5, 6],
            "default_work_hours": 8.0, "minimum_wage": None,
            "tax_framework": {"income_tax": False, "vat_rate": 0.05},
        },
        {
            "country_code": "SG", "country_name": "Singapore",
            "currency_code": "SGD", "currency_symbol": "S$",
            "date_format": "DD/MM/YYYY", "timezone": "Asia/Singapore",
            "default_weekend_days": [5, 6],
            "default_work_hours": 8.0, "minimum_wage": None,
            "tax_framework": {"income_tax": True, "cpf_rate_employee": 0.20, "cpf_rate_employer": 0.17},
        },
    ]

    for c in countries:
        exists = await session.execute(
            select(CountryConfig).where(CountryConfig.country_code == c["country_code"])
        )
        if exists.scalar_one_or_none():
            continue
        session.add(CountryConfig(
            id=str(uuid.uuid4()),
            business_id=_bid("CCFG", hash(c["country_code"]) % 999999),
            country_code=c["country_code"],
            country_name=c["country_name"],
            currency_code=c["currency_code"],
            currency_symbol=c["currency_symbol"],
            date_format=c["date_format"],
            timezone=c["timezone"],
            default_weekend_days=c["default_weekend_days"],
            default_work_hours=c["default_work_hours"],
            minimum_wage=c["minimum_wage"],
            tax_framework=c["tax_framework"],
            created_by=created_by,
            updated_by=created_by,
        ))
    await session.flush()
    logger.info("country_configs_seeded")


async def _seed_default_leave_policy(session: AsyncSession, company_id: str, created_by: str) -> None:
    """Seed a default India leave policy for the demo company."""
    import uuid
    from app.models.policy import LeavePolicy, LeaveType

    exists = await session.execute(
        select(LeavePolicy).where(
            LeavePolicy.company_id == company_id,
            LeavePolicy.name == "India Standard Policy",
        )
    )
    if exists.scalar_one_or_none():
        return

    policy_id = str(uuid.uuid4())
    session.add(LeavePolicy(
        id=policy_id,
        business_id=_bid("LPOL", 1),
        company_id=company_id,
        name="India Standard Policy",
        description="Standard leave policy for Indian operations",
        is_default=True,
        created_by=created_by,
        updated_by=created_by,
    ))
    await session.flush()

    leave_types = [
        {"name": "Casual Leave", "code": "CL", "annual_quota": 12, "is_paid": True,
         "is_carry_forward": False, "color": "#3B82F6"},
        {"name": "Sick Leave", "code": "SL", "annual_quota": 12, "is_paid": True,
         "requires_attachment": True, "min_attachment_days": 3, "color": "#EF4444"},
        {"name": "Earned Leave", "code": "EL", "annual_quota": 15, "is_paid": True,
         "is_carry_forward": True, "max_carry_forward": 30, "encashable": True, "color": "#10B981"},
        {"name": "Maternity Leave", "code": "ML", "annual_quota": 182, "is_paid": True,
         "applicable_gender": "female", "max_consecutive_days": 182, "color": "#EC4899"},
        {"name": "Paternity Leave", "code": "PL", "annual_quota": 15, "is_paid": True,
         "applicable_gender": "male", "max_consecutive_days": 15, "color": "#8B5CF6"},
        {"name": "Loss of Pay", "code": "LOP", "annual_quota": 365, "is_paid": False,
         "requires_approval": True, "color": "#6B7280"},
    ]

    for i, lt in enumerate(leave_types, start=1):
        session.add(LeaveType(
            id=str(uuid.uuid4()),
            business_id=_bid("LTYP", i),
            company_id=company_id,
            leave_policy_id=policy_id,
            name=lt["name"],
            code=lt["code"],
            annual_quota=lt["annual_quota"],
            is_paid=lt.get("is_paid", True),
            is_carry_forward=lt.get("is_carry_forward", False),
            max_carry_forward=lt.get("max_carry_forward"),
            encashable=lt.get("encashable", False),
            requires_approval=lt.get("requires_approval", True),
            requires_attachment=lt.get("requires_attachment", False),
            min_attachment_days=lt.get("min_attachment_days"),
            applicable_gender=lt.get("applicable_gender"),
            max_consecutive_days=lt.get("max_consecutive_days"),
            color=lt.get("color"),
            created_by=created_by,
            updated_by=created_by,
        ))
    await session.flush()
    logger.info("default_leave_policy_seeded")


async def _seed_default_salary_structure(session: AsyncSession, company_id: str, created_by: str) -> None:
    """Seed a standard CTC-based Indian salary structure."""
    import uuid
    from app.models.salary import SalaryStructure, SalaryComponent

    exists = await session.execute(
        select(SalaryStructure).where(
            SalaryStructure.company_id == company_id,
            SalaryStructure.name == "India CTC Structure",
        )
    )
    if exists.scalar_one_or_none():
        return

    struct_id = str(uuid.uuid4())
    session.add(SalaryStructure(
        id=struct_id,
        business_id=_bid("SSTR", 1),
        company_id=company_id,
        name="India CTC Structure",
        code="IND-CTC",
        description="Standard CTC-based salary breakdown for India",
        currency="INR",
        is_default=True,
        created_by=created_by,
        updated_by=created_by,
    ))
    await session.flush()

    components = [
        {"name": "Basic Salary", "code": "BASIC", "type": "earning",
         "calc": "percentage_of_ctc", "percentage": 40, "is_taxable": True, "is_mandatory": True, "priority": 1},
        {"name": "House Rent Allowance", "code": "HRA", "type": "earning",
         "calc": "percentage_of_basic", "percentage": 50, "is_taxable": True, "priority": 2},
        {"name": "Special Allowance", "code": "SA", "type": "earning",
         "calc": "fixed", "amount": 0, "is_taxable": True, "priority": 10,
         "description": "Balancing component = Gross - (Basic + HRA + other fixed)"},
        {"name": "Provident Fund (Employee)", "code": "PF_EE", "type": "deduction",
         "calc": "percentage_of_basic", "percentage": 12, "is_taxable": False, "is_mandatory": True,
         "max_amount": 1800, "priority": 20},
        {"name": "Provident Fund (Employer)", "code": "PF_ER", "type": "benefit",
         "calc": "percentage_of_basic", "percentage": 12, "is_taxable": False, "is_mandatory": True,
         "max_amount": 1800, "priority": 21},
        {"name": "Professional Tax", "code": "PT", "type": "deduction",
         "calc": "fixed", "amount": 200, "is_taxable": False, "priority": 30,
         "max_amount": 2500, "description": "State professional tax"},
    ]

    for i, comp in enumerate(components, start=1):
        session.add(SalaryComponent(
            id=str(uuid.uuid4()),
            business_id=_bid("SCMP", i),
            company_id=company_id,
            salary_structure_id=struct_id,
            name=comp["name"],
            code=comp["code"],
            component_type=comp["type"],
            calculation_type=comp["calc"],
            amount=comp.get("amount"),
            percentage=comp.get("percentage"),
            is_taxable=comp.get("is_taxable", True),
            is_mandatory=comp.get("is_mandatory", False),
            priority=comp["priority"],
            max_amount=comp.get("max_amount"),
            description=comp.get("description"),
            created_by=created_by,
            updated_by=created_by,
        ))
    await session.flush()
    logger.info("default_salary_structure_seeded")


# ── Demo Activity Data ──────────────────────────────────────────────────────

async def _seed_shifts(session: AsyncSession, company_id: str, created_by: str) -> str:
    """Seed default shift, return shift id."""
    from app.models.shift import Shift
    import uuid

    r = await session.execute(
        select(Shift).where(Shift.company_id == company_id, Shift.name == "General Shift")
    )
    shift = r.scalar_one_or_none()
    if shift:
        return shift.id

    sid = str(uuid.uuid4())
    session.add(Shift(
        id=sid,
        business_id=_bid("SHFT", 1),
        company_id=company_id,
        name="General Shift",
        code="GEN",
        shift_type="general",
        start_time="09:00",
        end_time="18:00",
        break_duration_minutes=60,
        work_hours=8.0,
        is_night_shift=False,
        grace_minutes=15,
        is_default=True,
        applicable_days=["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        created_by=created_by,
        updated_by=created_by,
    ))
    await session.flush()
    logger.info("shifts_seeded")
    return sid


async def _seed_branches_designations(
    session: AsyncSession, company_id: str, created_by: str,
) -> tuple[str, dict[str, str]]:
    """Seed HQ branch + designations. Returns (branch_id, {name: desig_id})."""
    from app.models.organization import Branch, Designation
    import uuid

    # Branch
    r = await session.execute(
        select(Branch).where(Branch.company_id == company_id, Branch.name == "Headquarters")
    )
    branch = r.scalar_one_or_none()
    if not branch:
        branch = Branch(
            id=str(uuid.uuid4()),
            business_id=_bid("BRNCH", 1),
            company_id=company_id,
            name="Headquarters",
            code="HQ",
            branch_type="head_office",
            city="Bengaluru",
            state="Karnataka",
            country="India",
            created_by=created_by,
            updated_by=created_by,
        )
        session.add(branch)
        await session.flush()

    # Designations
    desig_data = [
        ("Software Engineer", "SWE", 3),
        ("HR Specialist", "HRS", 3),
        ("Marketing Manager", "MKTM", 5),
        ("Financial Analyst", "FA", 3),
        ("Sales Executive", "SE", 2),
        ("Senior Engineer", "SRENG", 5),
        ("Team Lead", "TL", 6),
        ("Manager", "MGR", 7),
        ("Director", "DIR", 9),
    ]
    desig_map: dict[str, str] = {}
    for i, (name, code, level) in enumerate(desig_data, 1):
        r = await session.execute(
            select(Designation).where(
                Designation.company_id == company_id, Designation.name == name,
            )
        )
        d = r.scalar_one_or_none()
        if not d:
            d = Designation(
                id=str(uuid.uuid4()),
                business_id=_bid("DESG", i),
                company_id=company_id,
                name=name,
                code=code,
                level=level,
                created_by=created_by,
                updated_by=created_by,
            )
            session.add(d)
            await session.flush()
        desig_map[name] = d.id

    logger.info("branches_designations_seeded")
    return branch.id, desig_map


async def _seed_attendance_policy(session: AsyncSession, company_id: str, created_by: str) -> None:
    from app.models.policy import AttendancePolicy
    import uuid

    r = await session.execute(
        select(AttendancePolicy).where(AttendancePolicy.company_id == company_id)
    )
    if r.scalar_one_or_none():
        return

    session.add(AttendancePolicy(
        id=str(uuid.uuid4()),
        business_id=_bid("APOL", 1),
        company_id=company_id,
        name="Standard Policy",
        check_in_required=True,
        auto_checkout=True,
        auto_checkout_time="22:00",
        allow_manual_entry=True,
        require_approval_for_corrections=True,
        track_breaks=False,
        grace_period_minutes=15,
        half_day_hours=4.0,
        min_hours_for_full_day=7.0,
        enable_geo_fencing=False,
        allowed_check_in_methods=["web", "mobile"],
        created_by=created_by,
        updated_by=created_by,
    ))
    await session.flush()
    logger.info("attendance_policy_seeded")


async def _seed_organization_settings(session: AsyncSession, company_id: str, created_by: str) -> None:
    from app.models.organization import OrganizationSettings
    import uuid

    r = await session.execute(
        select(OrganizationSettings).where(OrganizationSettings.company_id == company_id)
    )
    if r.scalar_one_or_none():
        return

    session.add(OrganizationSettings(
        id=str(uuid.uuid4()),
        business_id=_bid("OSET", 1),
        company_id=company_id,
        working_days=[0, 1, 2, 3, 4],
        weekend_days=[5, 6],
        work_start_time="09:00",
        work_end_time="18:00",
        daily_work_hours=8.0,
        weekly_work_hours=40.0,
        late_threshold_minutes=15,
        overtime_threshold_hours=8.0,
        overtime_multiplier=1.5,
        payroll_cycle="monthly",
        payroll_process_day=28,
        default_currency="INR",
        probation_period_days=180,
        notice_period_days=30,
        date_format="DD/MM/YYYY",
        time_format="12h",
        enable_overtime=True,
        enable_shifts=True,
        enable_geo_tracking=False,
        created_by=created_by,
        updated_by=created_by,
    ))
    await session.flush()
    logger.info("organization_settings_seeded")


async def _seed_employee_salaries(
    session: AsyncSession, company_id: str, created_by: str,
) -> None:
    """Assign salary structures to all employees."""
    from app.models.salary import EmployeeSalary, SalaryStructure
    from app.models.employee import Employee
    import uuid

    # Find salary structure
    r = await session.execute(
        select(SalaryStructure).where(
            SalaryStructure.company_id == company_id, SalaryStructure.is_default == True,
        )
    )
    struct = r.scalar_one_or_none()
    if not struct:
        return

    # CTC values per employee code
    ctc_map = {
        "EMP-000001": 1200000,  # Alice - 12L
        "EMP-000002": 900000,   # Bob - 9L
        "EMP-000003": 1100000,  # Carol - 11L
        "EMP-000004": 1000000,  # Dave - 10L
        "EMP-000005": 800000,   # Eve - 8L
    }

    employees = (await session.execute(
        select(Employee).where(Employee.company_id == company_id)
    )).scalars().all()

    for emp in employees:
        r = await session.execute(
            select(EmployeeSalary).where(EmployeeSalary.employee_id == emp.id)
        )
        if r.scalar_one_or_none():
            continue

        ctc = ctc_map.get(emp.employee_code, 600000)
        basic = ctc * 0.4
        hra = basic * 0.5
        pf_ee = min(basic * 0.12, 1800 * 12)
        pt = 200 * 12
        gross = ctc  # simplified
        net = gross - pf_ee - pt

        session.add(EmployeeSalary(
            id=str(uuid.uuid4()),
            business_id=_bid("ESAL", int(emp.employee_code.split("-")[1])),
            company_id=company_id,
            employee_id=emp.id,
            salary_structure_id=struct.id,
            ctc=ctc,
            basic_salary=basic,
            gross_salary=gross,
            net_salary=net,
            currency="INR",
            effective_from="2023-01-15",
            created_by=created_by,
            updated_by=created_by,
        ))
    await session.flush()
    logger.info("employee_salaries_seeded")


async def _seed_holidays_2025(session: AsyncSession, company_id: str, created_by: str) -> None:
    from app.models.attendance import Holiday
    from datetime import date
    import uuid

    holidays = [
        (date(2025, 1, 26), "Republic Day", "public"),
        (date(2025, 3, 14), "Holi", "public"),
        (date(2025, 3, 31), "Eid ul-Fitr", "public"),
        (date(2025, 4, 6), "Ram Navami", "restricted"),
        (date(2025, 4, 10), "Mahavir Jayanti", "public"),
        (date(2025, 4, 14), "Ambedkar Jayanti", "public"),
        (date(2025, 4, 18), "Good Friday", "public"),
        (date(2025, 5, 1), "May Day", "public"),
        (date(2025, 5, 12), "Buddha Purnima", "public"),
        (date(2025, 6, 7), "Eid ul-Adha", "public"),
        (date(2025, 7, 6), "Muharram", "restricted"),
        (date(2025, 8, 15), "Independence Day", "public"),
        (date(2025, 8, 16), "Janmashtami", "public"),
        (date(2025, 9, 5), "Milad-un-Nabi", "restricted"),
        (date(2025, 10, 2), "Gandhi Jayanti", "public"),
        (date(2025, 10, 2), "Dussehra", "public"),
        (date(2025, 10, 20), "Diwali", "public"),
        (date(2025, 10, 21), "Diwali (Day 2)", "public"),
        (date(2025, 11, 5), "Guru Nanak Jayanti", "public"),
        (date(2025, 12, 25), "Christmas", "public"),
    ]

    for i, (dt, name, htype) in enumerate(holidays, 1):
        r = await session.execute(
            select(Holiday).where(
                Holiday.company_id == company_id,
                Holiday.date == dt,
                Holiday.name == name,
            )
        )
        if r.scalar_one_or_none():
            continue
        session.add(Holiday(
            id=str(uuid.uuid4()),
            business_id=_bid("HLDY", i),
            company_id=company_id,
            name=name,
            date=dt,
            holiday_type=htype,
            country="IN",
            is_paid=True,
            created_by=created_by,
            updated_by=created_by,
        ))
    await session.flush()
    logger.info("holidays_2025_seeded")


async def _seed_attendance_records(
    session: AsyncSession, company_id: str, created_by: str,
) -> None:
    """Seed 30 days of attendance for all employees."""
    from app.models.attendance import Attendance
    from app.models.employee import Employee
    from datetime import date, datetime, timedelta, timezone
    import uuid
    import random

    employees = (await session.execute(
        select(Employee).where(Employee.company_id == company_id)
    )).scalars().all()

    if not employees:
        return

    today = date.today()
    start = today - timedelta(days=30)

    random.seed(42)  # deterministic

    for emp in employees:
        for day_offset in range(31):
            d = start + timedelta(days=day_offset)
            if d >= today:
                break
            # skip weekends
            if d.weekday() >= 5:
                continue

            # check if already exists
            r = await session.execute(
                select(Attendance).where(
                    Attendance.employee_id == emp.id,
                    Attendance.attendance_date == d,
                )
            )
            if r.scalar_one_or_none():
                continue

            # 80% present, 10% late, 5% half_day, 5% absent
            roll = random.random()
            if roll < 0.80:
                status = "present"
                ci_h, ci_m = 9, random.randint(0, 10)
                co_h, co_m = random.choice([17, 18]), random.randint(0, 55)
                late_min = 0
            elif roll < 0.90:
                status = "late"
                ci_h, ci_m = 9, random.randint(20, 50)
                co_h, co_m = 18, random.randint(0, 30)
                late_min = ci_m - 15
            elif roll < 0.95:
                status = "half_day"
                ci_h, ci_m = 9, random.randint(0, 15)
                co_h, co_m = 13, random.randint(0, 30)
                late_min = 0
            else:
                status = "absent"
                ci_h = ci_m = co_h = co_m = None
                late_min = 0

            total_hours = None
            check_in = check_out = None
            if ci_h is not None:
                check_in = datetime(d.year, d.month, d.day, ci_h, ci_m, tzinfo=timezone.utc)
                check_out = datetime(d.year, d.month, d.day, co_h, co_m, tzinfo=timezone.utc)
                total_hours = round((check_out - check_in).total_seconds() / 3600, 2)

            overtime = max(0, (total_hours or 0) - 8.0)

            session.add(Attendance(
                id=str(uuid.uuid4()),
                business_id=_bid("ATT", day_offset * 10 + int(emp.employee_code.split("-")[1])),
                company_id=company_id,
                employee_id=emp.id,
                attendance_date=d,
                check_in_time=check_in,
                check_out_time=check_out,
                total_hours=total_hours,
                overtime_hours=round(overtime, 2),
                late_minutes=late_min,
                status=status,
                check_in_method="web" if check_in else None,
                check_out_method="web" if check_out else None,
                is_approved=True,
                approved_by=created_by,
                created_by=created_by,
                updated_by=created_by,
            ))

    await session.flush()
    logger.info("attendance_records_seeded")


async def _seed_leave_balances(
    session: AsyncSession, company_id: str, created_by: str,
) -> None:
    """Seed leave balances for all employees for 2025."""
    from app.models.policy import LeaveBalance, LeaveType
    from app.models.employee import Employee
    import uuid

    employees = (await session.execute(
        select(Employee).where(Employee.company_id == company_id)
    )).scalars().all()

    leave_types = (await session.execute(
        select(LeaveType).where(LeaveType.company_id == company_id)
    )).scalars().all()

    if not employees or not leave_types:
        return

    year = 2025
    for emp in employees:
        for lt in leave_types:
            r = await session.execute(
                select(LeaveBalance).where(
                    LeaveBalance.employee_id == emp.id,
                    LeaveBalance.leave_type_id == lt.id,
                    LeaveBalance.year == year,
                )
            )
            if r.scalar_one_or_none():
                continue

            # some used days
            used = 0.0
            if lt.code in ("CL", "SL"):
                used = 2.0
            elif lt.code == "EL":
                used = 3.0

            session.add(LeaveBalance(
                id=str(uuid.uuid4()),
                business_id=_bid("LBAL", int(emp.employee_code.split("-")[1]) * 10 + leave_types.index(lt)),
                company_id=company_id,
                employee_id=emp.id,
                leave_type_id=lt.id,
                year=year,
                allocated=lt.annual_quota or 0,
                used=used,
                pending=0.0,
                carried_forward=0.0,
                created_by=created_by,
                updated_by=created_by,
            ))
    await session.flush()
    logger.info("leave_balances_seeded")


async def _seed_leave_requests(
    session: AsyncSession, company_id: str, created_by: str,
) -> None:
    """Seed sample leave requests."""
    from app.models.attendance import LeaveRequest
    from app.models.employee import Employee
    from app.models.policy import LeaveType
    from datetime import date, datetime, timezone
    import uuid

    employees = (await session.execute(
        select(Employee).where(Employee.company_id == company_id)
    )).scalars().all()
    if not employees:
        return

    leave_types = (await session.execute(
        select(LeaveType).where(LeaveType.company_id == company_id)
    )).scalars().all()
    lt_map = {lt.code: lt.id for lt in leave_types}

    requests_data = [
        # (emp_index, leave_code, start, end, days, status, reason)
        (0, "CL", date(2025, 2, 10), date(2025, 2, 11), 2, "approved", "Family function"),
        (0, "SL", date(2025, 3, 5), date(2025, 3, 6), 2, "approved", "Not feeling well"),
        (1, "CL", date(2025, 1, 20), date(2025, 1, 21), 2, "approved", "Personal work"),
        (1, "EL", date(2025, 7, 1), date(2025, 7, 4), 4, "pending", "Summer vacation"),
        (2, "SL", date(2025, 3, 15), date(2025, 3, 15), 1, "approved", "Doctor appointment"),
        (2, "CL", date(2025, 4, 25), date(2025, 4, 25), 1, "pending", "Personal errand"),
        (3, "EL", date(2025, 5, 12), date(2025, 5, 16), 5, "rejected", "Travel plans changed"),
        (3, "CL", date(2025, 3, 3), date(2025, 3, 4), 2, "approved", "Family event"),
        (4, "SL", date(2025, 2, 18), date(2025, 2, 19), 2, "approved", "Fever"),
        (4, "CL", date(2025, 6, 10), date(2025, 6, 11), 2, "pending", "Wedding"),
    ]

    # check if already seeded
    r = await session.execute(
        select(LeaveRequest).where(LeaveRequest.company_id == company_id)
    )
    if r.scalars().first():
        return

    for i, (emp_idx, lcode, start, end, days, status, reason) in enumerate(requests_data, 1):
        if emp_idx >= len(employees) or lcode not in lt_map:
            continue
        emp = employees[emp_idx]
        lr = LeaveRequest(
            id=str(uuid.uuid4()),
            business_id=_bid("LRQ", i),
            company_id=company_id,
            employee_id=emp.id,
            leave_type=lcode,
            start_date=start,
            end_date=end,
            total_days=days,
            reason=reason,
            status=status,
            created_by=created_by,
            updated_by=created_by,
        )
        if status == "approved":
            lr.approved_by = created_by
            lr.approved_at = datetime(start.year, start.month, start.day, 10, 0, tzinfo=timezone.utc)
        elif status == "rejected":
            lr.approved_by = created_by
            lr.rejection_reason = "Team capacity constraints during this period"
        session.add(lr)

    await session.flush()
    logger.info("leave_requests_seeded")


async def _seed_payroll_data(
    session: AsyncSession, company_id: str, created_by: str,
) -> None:
    """Seed 3 months of payroll runs with payslips."""
    from app.models.payroll import PayrollRun, PayrollItem
    from app.models.salary import EmployeeSalary
    from app.models.employee import Employee
    from datetime import datetime, timezone
    import uuid

    employees = (await session.execute(
        select(Employee).where(Employee.company_id == company_id)
    )).scalars().all()
    if not employees:
        return

    # get salary map
    salary_map: dict[str, EmployeeSalary] = {}
    for emp in employees:
        r = await session.execute(
            select(EmployeeSalary).where(EmployeeSalary.employee_id == emp.id)
        )
        sal = r.scalar_one_or_none()
        if sal:
            salary_map[emp.id] = sal

    months = [(2025, 1), (2025, 2), (2025, 3)]

    for run_idx, (year, month) in enumerate(months, 1):
        r = await session.execute(
            select(PayrollRun).where(
                PayrollRun.company_id == company_id,
                PayrollRun.period_month == month,
                PayrollRun.period_year == year,
            )
        )
        if r.scalar_one_or_none():
            continue

        total_gross = total_ded = total_net = 0.0

        run_id = str(uuid.uuid4())
        run = PayrollRun(
            id=run_id,
            business_id=_bid("PRUN", run_idx),
            company_id=company_id,
            period_month=month,
            period_year=year,
            status="paid",
            processed_at=datetime(year, month, 28, 10, 0, tzinfo=timezone.utc),
            total_employees=len(salary_map),
            currency="INR",
            notes=f"Payroll for {month:02d}/{year}",
            created_by=created_by,
            updated_by=created_by,
        )

        items = []
        for item_idx, emp in enumerate(employees, 1):
            sal = salary_map.get(emp.id)
            if not sal:
                continue

            monthly_ctc = sal.ctc / 12
            monthly_basic = sal.basic_salary / 12
            monthly_hra = monthly_basic * 0.5
            monthly_sa = monthly_ctc - monthly_basic - monthly_hra
            gross = monthly_basic + monthly_hra + monthly_sa
            pf = min(monthly_basic * 0.12, 1800)
            pt = 200
            tax = gross * 0.05  # simplified
            total_deductions = pf + pt + tax
            net = gross - total_deductions

            total_gross += gross
            total_ded += total_deductions
            total_net += net

            items.append(PayrollItem(
                id=str(uuid.uuid4()),
                business_id=_bid("PITM", run_idx * 100 + item_idx),
                company_id=company_id,
                payroll_run_id=run_id,
                employee_id=emp.id,
                gross_salary=round(gross, 2),
                basic_salary=round(monthly_basic, 2),
                allowances=round(monthly_hra + monthly_sa, 2),
                deductions=round(pf + pt, 2),
                tax_amount=round(tax, 2),
                total_deductions=round(total_deductions, 2),
                net_salary=round(net, 2),
                currency="INR",
                payment_status="paid",
                payment_date=datetime(year, month, 28, 12, 0, tzinfo=timezone.utc),
                created_by=created_by,
                updated_by=created_by,
            ))

        run.total_gross = round(total_gross, 2)
        run.total_deductions = round(total_ded, 2)
        run.total_net = round(total_net, 2)
        session.add(run)
        await session.flush()

        for item in items:
            session.add(item)
        await session.flush()

    logger.info("payroll_data_seeded")


async def _seed_notifications(
    session: AsyncSession, company_id: str, user_map: dict[str, str],
) -> None:
    """Seed sample notifications for users."""
    from app.models.notification import Notification
    from datetime import datetime, timezone
    import uuid

    # check if already seeded
    first_uid = next(iter(user_map.values()), None)
    if not first_uid:
        return
    r = await session.execute(
        select(Notification).where(
            Notification.company_id == company_id,
            Notification.user_id == first_uid,
        )
    )
    if r.scalars().first():
        return

    notifs = [
        ("System", "Welcome to SRP HRMS! Your account has been set up.", "system", False),
        ("Attendance", "Your attendance for yesterday has been approved.", "attendance", True),
        ("Payroll", "Your payslip for March 2025 is ready.", "payroll", False),
        ("Leave", "Your leave request has been approved.", "leave", True),
        ("HR", "Company holiday calendar for 2025 has been published.", "hr", False),
        ("Performance", "Your quarterly review is due. Please complete your self-assessment.", "performance", False),
    ]

    for uid in user_map.values():
        for i, (title, message, category, is_read) in enumerate(notifs, 1):
            session.add(Notification(
                id=str(uuid.uuid4()),
                business_id=_bid("NOTIF", hash(uid + str(i)) % 999999),
                company_id=company_id,
                user_id=uid,
                title=title,
                message=message,
                category=category,
                is_read=is_read,
                created_by=uid,
                updated_by=uid,
            ))
    await session.flush()
    logger.info("notifications_seeded")


async def _seed_performance_reviews(
    session: AsyncSession, company_id: str, created_by: str,
) -> None:
    """Seed performance reviews for employees."""
    from app.models.performance import PerformanceReview
    from app.models.employee import Employee
    import uuid
    import random

    employees = (await session.execute(
        select(Employee).where(Employee.company_id == company_id)
    )).scalars().all()
    if not employees:
        return

    r = await session.execute(
        select(PerformanceReview).where(PerformanceReview.company_id == company_id)
    )
    if r.scalars().first():
        return

    random.seed(42)
    for i, emp in enumerate(employees, 1):
        goal = round(random.uniform(3.0, 5.0), 1)
        behavior = round(random.uniform(3.0, 5.0), 1)
        overall = round((goal + behavior) / 2, 1)

        session.add(PerformanceReview(
            id=str(uuid.uuid4()),
            business_id=_bid("PREV", i),
            company_id=company_id,
            employee_id=emp.id,
            reviewer_id=created_by,
            review_period="annual",
            review_year=2024,
            goal_score=goal,
            behavior_score=behavior,
            overall_score=overall,
            comments=f"Good performance throughout the year. Keep up the great work.",
            status="completed",
            created_by=created_by,
            updated_by=created_by,
        ))
    await session.flush()
    logger.info("performance_reviews_seeded")


async def main() -> None:
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    session_factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

    async with session_factory() as session:
        try:
            company_id = await _upsert_company(session)
            await _upsert_super_admin(session)
            hr_admin_id = await _upsert_company_admin(session, company_id)
            dept_map = await _seed_departments(session, company_id, hr_admin_id)
            emp_ids = await _seed_employees(session, company_id, hr_admin_id, dept_map)
            await _seed_jobs(session, company_id, hr_admin_id, dept_map)
            await _seed_candidates(session, company_id, hr_admin_id)
            await _seed_country_configs(session, hr_admin_id)
            await _seed_default_leave_policy(session, company_id, hr_admin_id)
            await _seed_default_salary_structure(session, company_id, hr_admin_id)

            # Demo activity data
            shift_id = await _seed_shifts(session, company_id, hr_admin_id)
            branch_id, desig_map = await _seed_branches_designations(session, company_id, hr_admin_id)
            await _seed_attendance_policy(session, company_id, hr_admin_id)
            await _seed_organization_settings(session, company_id, hr_admin_id)
            await _seed_employee_salaries(session, company_id, hr_admin_id)
            await _seed_holidays_2025(session, company_id, hr_admin_id)
            await _seed_attendance_records(session, company_id, hr_admin_id)
            await _seed_leave_balances(session, company_id, hr_admin_id)
            await _seed_leave_requests(session, company_id, hr_admin_id)
            await _seed_payroll_data(session, company_id, hr_admin_id)
            await _seed_performance_reviews(session, company_id, hr_admin_id)

            # Build user map for notifications
            from app.models.user import User
            users = (await session.execute(
                select(User).where(User.company_id == company_id)
            )).scalars().all()
            user_map = {u.email: u.id for u in users}
            await _seed_notifications(session, company_id, user_map)

            await session.commit()
            logger.info("seed_complete")
        except Exception as exc:
            await session.rollback()
            logger.exception("seed_failed", error=str(exc))
            raise

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
