from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_farm(client: AsyncClient, auth_headers: dict):
    response = await client.post(
        "/api/v1/farms",
        json={"name": "Test Farm", "address": "123 Durian St"},
        headers=auth_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["data"]["name"] == "Test Farm"


@pytest.mark.asyncio
async def test_list_farms(client: AsyncClient, auth_headers: dict):
    await client.post(
        "/api/v1/farms",
        json={"name": "Farm A"},
        headers=auth_headers,
    )
    response = await client.get(
        "/api/v1/farms",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]["items"]) >= 1


@pytest.mark.asyncio
async def test_get_farm(client: AsyncClient, auth_headers: dict):
    create_resp = await client.post(
        "/api/v1/farms",
        json={"name": "Target Farm"},
        headers=auth_headers,
    )
    farm_id = create_resp.json()["data"]["id"]

    response = await client.get(
        f"/api/v1/farms/{farm_id}",
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["data"]["name"] == "Target Farm"


@pytest.mark.asyncio
async def test_delete_farm(client: AsyncClient, auth_headers: dict):
    create_resp = await client.post(
        "/api/v1/farms",
        json={"name": "Delete Me"},
        headers=auth_headers,
    )
    farm_id = create_resp.json()["data"]["id"]

    response = await client.delete(
        f"/api/v1/farms/{farm_id}",
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Farm deleted"
