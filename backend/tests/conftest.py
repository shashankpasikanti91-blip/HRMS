"""Shared pytest fixtures for SRP HRMS backend tests."""
from __future__ import annotations

import asyncio
import os
import uuid
from pathlib import Path
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# Use an isolated SQLite DB for tests by default (overridden by DATABASE_URL_TEST if set)
TEST_DB_PATH = Path(__file__).with_name(".test_hrms.db").resolve().as_posix()
TEST_DATABASE_URL = os.getenv(
    "DATABASE_URL_TEST",
    f"sqlite+aiosqlite:///{TEST_DB_PATH}",
)

os.environ.setdefault("DATABASE_URL", TEST_DATABASE_URL)
os.environ.setdefault("SECRET_KEY", "test-secret-key-do-not-use-in-prod")
os.environ.setdefault("SUPER_ADMIN_EMAIL", "superadmin@test.com")
os.environ.setdefault("SUPER_ADMIN_PASSWORD", "SuperAdmin@1234")
os.environ.setdefault("ENVIRONMENT", "testing")
os.environ.setdefault("N8N_ENABLED", "false")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/15")

from app.core.database import Base
from app.core.security import hash_password
from app.main import app
from app.utils.enums import UserRole, UserStatus, CompanyStatus, SubscriptionPlan


# ── Engine / Session ─────────────────────────────────────────────────────────

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def test_engine():
    if TEST_DATABASE_URL.startswith("sqlite"):
        test_db_file = Path(TEST_DB_PATH)
        if test_db_file.exists():
            test_db_file.unlink()

    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        connect_args={"check_same_thread": False} if TEST_DATABASE_URL.startswith("sqlite") else {},
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()
    if TEST_DATABASE_URL.startswith("sqlite"):
        test_db_file = Path(TEST_DB_PATH)
        if test_db_file.exists():
            test_db_file.unlink()


@pytest_asyncio.fixture
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    session_factory = async_sessionmaker(test_engine, expire_on_commit=False, class_=AsyncSession)
    async with session_factory() as session:
        yield session
        await session.rollback()


# ── HTTP Client ──────────────────────────────────────────────────────────────

@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    from app.core.database import get_db

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


# ── Demo Data ────────────────────────────────────────────────────────────────

@pytest_asyncio.fixture
async def demo_company(db_session: AsyncSession):
    from app.models.company import Company

    cid = str(uuid.uuid4())
    company = Company(
        id=cid,
        business_id=f"COMP-{cid[:6]}",
        name="Test Corp",
        slug=f"test-corp-{cid[:6]}",
        email="admin@testcorp.com",
        status=CompanyStatus.ACTIVE,
        subscription_plan=SubscriptionPlan.STARTER,
        employee_limit=100,
    )
    db_session.add(company)
    await db_session.flush()
    return company


@pytest_asyncio.fixture
async def demo_hr_user(db_session: AsyncSession, demo_company):
    from app.models.user import User

    uid = str(uuid.uuid4())
    user = User(
        id=uid,
        business_id=f"USR-{uid[:6]}",
        email=f"hr-{uid[:6]}@testcorp.com",
        password_hash=hash_password("Test@1234"),
        full_name="Test HR",
        first_name="Test",
        last_name="HR",
        role=UserRole.HR_ADMIN,
        status=UserStatus.ACTIVE,
        company_id=demo_company.id,
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest_asyncio.fixture
async def auth_headers(client: AsyncClient, demo_company, demo_hr_user, db_session):
    """Return Authorization headers for the demo HR user."""
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": demo_hr_user.email, "password": "Test@1234"},
    )
    assert resp.status_code == 200, resp.text
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
