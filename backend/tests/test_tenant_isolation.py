"""Tests for multi-tenant isolation — ensures company A cannot see company B's data."""
from __future__ import annotations

import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.company import Company
from app.models.user import User
from app.core.security import hash_password
from app.utils.enums import UserRole, UserStatus, CompanyStatus, SubscriptionPlan


async def _make_company_and_token(client: AsyncClient, db_session: AsyncSession, suffix: str):
    cid = str(uuid.uuid4())
    company = Company(
        id=cid,
        business_id=f"COMP-T{cid[:5]}",
        name=f"Tenant {suffix}",
        slug=f"tenant-{cid[:6]}",
        email=f"admin@tenant{suffix}.com",
        status=CompanyStatus.ACTIVE,
        subscription_plan=SubscriptionPlan.STARTER,
        max_employees=10,
    )
    db_session.add(company)

    uid = str(uuid.uuid4())
    user = User(
        id=uid,
        business_id=f"USR-T{uid[:5]}",
        email=f"admin@tenant{suffix}.com",
        hashed_password=hash_password("TenantPass@1"),
        first_name="Admin",
        last_name=suffix,
        role=UserRole.HR_ADMIN,
        status=UserStatus.ACTIVE,
        is_email_verified=True,
        company_id=cid,
    )
    db_session.add(user)
    await db_session.flush()

    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": user.email, "password": "TenantPass@1"},
    )
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}, cid


@pytest.mark.asyncio
async def test_tenant_cannot_see_other_tenant_employees(
    client: AsyncClient, db_session: AsyncSession
):
    headers_a, company_a = await _make_company_and_token(client, db_session, "A")
    headers_b, company_b = await _make_company_and_token(client, db_session, "B")

    # Create dept for A
    dept_resp = await client.post(
        "/api/v1/departments",
        json={"name": "Alpha Dept", "code": "ALP"},
        headers=headers_a,
    )
    assert dept_resp.status_code == 201
    dept_bid_a = dept_resp.json()["business_id"]

    # List departments from B's perspective — should NOT see A's department
    list_resp = await client.get("/api/v1/departments", headers=headers_b)
    assert list_resp.status_code == 200
    bids = [d["business_id"] for d in list_resp.json()["items"]]
    assert dept_bid_a not in bids


@pytest.mark.asyncio
async def test_tenant_cannot_access_other_tenant_department_by_id(
    client: AsyncClient, db_session: AsyncSession
):
    headers_a, _ = await _make_company_and_token(client, db_session, "X")
    headers_b, _ = await _make_company_and_token(client, db_session, "Y")

    dept_resp = await client.post(
        "/api/v1/departments",
        json={"name": "X Dept", "code": "XDPT"},
        headers=headers_a,
    )
    assert dept_resp.status_code == 201
    dept_bid = dept_resp.json()["business_id"]

    # B attempts to GET A's department by business_id
    get_resp = await client.get(f"/api/v1/departments/{dept_bid}", headers=headers_b)
    assert get_resp.status_code == 404
