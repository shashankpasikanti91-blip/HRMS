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
        select(User).where(User.email == settings.SUPER_ADMIN_EMAIL)
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
        email=settings.SUPER_ADMIN_EMAIL,
        password_hash=hash_password(settings.SUPER_ADMIN_PASSWORD),
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
        role=UserRole.HR_ADMIN.value,
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
            await session.commit()
            logger.info("seed_complete")
        except Exception as exc:
            await session.rollback()
            logger.exception("seed_failed", error=str(exc))
            raise

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
