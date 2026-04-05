"""Tests for authentication endpoints."""
from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, demo_hr_user):
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": demo_hr_user.email, "password": "Test@1234"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient, demo_hr_user):
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": demo_hr_user.email, "password": "WrongPass"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_login_unknown_email(client: AsyncClient):
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@nowhere.com", "password": "Test@1234"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_get_me(client: AsyncClient, auth_headers):
    resp = await client.get("/api/v1/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "email" in data
    assert "business_id" in data


@pytest.mark.asyncio
async def test_protected_route_without_token(client: AsyncClient):
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_register_company(client: AsyncClient):
    resp = await client.post(
        "/api/v1/auth/register",
        json={
            "company_name": "New Startup Inc",
            "company_email": "admin@newstartup.com",
            "admin_email": "founder@newstartup.com",
            "admin_password": "Founder@1234",
            "admin_first_name": "Founder",
            "admin_last_name": "Person",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert "company" in data
    assert data["company"]["business_id"].startswith("COMP-")
