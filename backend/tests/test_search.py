"""Tests for global search and business ID generation."""
from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_global_search_returns_results(client: AsyncClient, auth_headers):
    """Search should return a structured response even if empty."""
    resp = await client.get("/api/v1/search/global?q=test", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "results" in data
    assert isinstance(data["results"], list)
    assert "total" in data


@pytest.mark.asyncio
async def test_global_search_requires_auth(client: AsyncClient):
    resp = await client.get("/api/v1/search/global?q=test")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_global_search_min_length(client: AsyncClient, auth_headers):
    """Empty query should fail validation."""
    resp = await client.get("/api/v1/search/global?q=", headers=auth_headers)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_business_id_format_department(client: AsyncClient, auth_headers):
    """Departments must receive a DEPT-XXXXXX business ID."""
    resp = await client.post(
        "/api/v1/departments",
        json={"name": "Search Test Dept", "code": "SRCH"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    bid = resp.json()["business_id"]
    # Format: DEPT-000001
    parts = bid.split("-")
    assert len(parts) == 2
    assert parts[0] == "DEPT"
    assert parts[1].isdigit()
    assert len(parts[1]) == 6


@pytest.mark.asyncio
async def test_search_finds_department_by_business_id(client: AsyncClient, auth_headers):
    """A just-created department should be findable by its business ID."""
    dept_resp = await client.post(
        "/api/v1/departments",
        json={"name": "Findable Dept", "code": "FIND"},
        headers=auth_headers,
    )
    assert dept_resp.status_code == 201
    bid = dept_resp.json()["business_id"]

    search_resp = await client.get(f"/api/v1/search/global?q={bid}", headers=auth_headers)
    assert search_resp.status_code == 200
    results = search_resp.json()["results"]
    bids_found = [r["business_id"] for r in results]
    assert bid in bids_found
