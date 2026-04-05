"""Tests for employee and department endpoints."""
from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_department(client: AsyncClient, auth_headers):
    resp = await client.post(
        "/api/v1/departments",
        json={"name": "Engineering", "code": "ENG"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["business_id"].startswith("DEPT-")
    assert data["name"] == "Engineering"


@pytest.mark.asyncio
async def test_list_departments(client: AsyncClient, auth_headers):
    resp = await client.get("/api/v1/departments", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_create_employee(client: AsyncClient, auth_headers, demo_company, db_session):
    # First create a department
    dept_resp = await client.post(
        "/api/v1/departments",
        json={"name": "HR Dept", "code": "HR"},
        headers=auth_headers,
    )
    assert dept_resp.status_code == 201
    dept_bid = dept_resp.json()["business_id"]

    # Create user for employee
    import uuid
    from app.models.user import User
    from app.core.security import hash_password
    from app.utils.enums import UserRole, UserStatus

    uid = str(uuid.uuid4())
    user = User(
        id=uid,
        business_id=f"USR-{uid[:6]}",
        email=f"emp-{uid[:6]}@test.com",
        hashed_password=hash_password("Test@1234"),
        first_name="Test",
        last_name="Employee",
        role=UserRole.EMPLOYEE,
        status=UserStatus.ACTIVE,
        is_email_verified=True,
        company_id=demo_company.id,
    )
    db_session.add(user)
    await db_session.flush()

    resp = await client.post(
        "/api/v1/employees",
        json={
            "user_id": user.id,
            "first_name": "Test",
            "last_name": "Employee",
            "email": user.email,
            "designation": "Developer",
            "department_id": dept_bid,
            "date_of_joining": "2024-01-01",
            "employment_type": "full_time",
            "work_mode": "hybrid",
        },
        headers=auth_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["business_id"].startswith("EMP-")
    return data["business_id"]


@pytest.mark.asyncio
async def test_list_employees(client: AsyncClient, auth_headers):
    resp = await client.get("/api/v1/employees", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
