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

    EMAIL = "hr@acme.com"
    result = await session.execute(select(User).where(User.email == EMAIL))
    user = result.scalar_one_or_none()
    if user:
        return user.id

    import uuid
    uid = str(uuid.uuid4())
    user = User(
        id=uid,
        business_id=_bid("USR", 2),
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
                role=UserRole.EMPLOYEE.value,
                status=UserStatus.ACTIVE.value,
                company_id=company_id,
            )
            session.add(user)
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


async def main() -> None:
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    session_factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

    async with session_factory() as session:
        try:
            company_id = await _upsert_company(session)
            await _upsert_super_admin(session)
            hr_admin_id = await _upsert_company_admin(session, company_id)
            dept_map = await _seed_departments(session, company_id, hr_admin_id)
            await _seed_employees(session, company_id, hr_admin_id, dept_map)
            await _seed_jobs(session, company_id, hr_admin_id, dept_map)
            await _seed_candidates(session, company_id, hr_admin_id)
            await _seed_country_configs(session, hr_admin_id)
            await _seed_default_leave_policy(session, company_id, hr_admin_id)
            await _seed_default_salary_structure(session, company_id, hr_admin_id)
            await session.commit()
            logger.info("seed_complete")
        except Exception as exc:
            await session.rollback()
            logger.exception("seed_failed", error=str(exc))
            raise

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
