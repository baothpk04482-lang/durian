from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "fullname": "New Farmer",
            "email": "new@test.com",
            "password": "testpass123",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["message"] == "Registration successful"
    assert data["data"]["fullname"] == "New Farmer"
    assert data["data"]["email"] == "new@test.com"


@pytest.mark.asyncio
async def test_register_duplicate(client: AsyncClient):
    await client.post(
        "/api/v1/auth/register",
        json={
            "fullname": "Farmer One",
            "email": "dup@test.com",
            "password": "testpass123",
        },
    )
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "fullname": "Farmer Two",
            "email": "dup@test.com",
            "password": "testpass123",
        },
    )
    assert response.status_code == 409
    data = response.json()
    assert data["success"] is False


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    await client.post(
        "/api/v1/auth/register",
        json={
            "fullname": "Login User",
            "email": "login@test.com",
            "password": "testpass123",
        },
    )
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "login@test.com",
            "password": "testpass123",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert "refresh_token" in data["data"]


@pytest.mark.asyncio
async def test_change_password_success(client: AsyncClient):
    await client.post(
        "/api/v1/auth/register",
        json={
            "fullname": "Change Pwd",
            "email": "changepwd@test.com",
            "password": "oldpass123",
        },
    )
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "changepwd@test.com", "password": "oldpass123"},
    )
    token = login_resp.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = await client.put(
        "/api/v1/auth/change-password",
        json={"old_password": "oldpass123", "new_password": "newpass456"},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["success"] is True

    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "changepwd@test.com", "password": "newpass456"},
    )
    assert login_resp.status_code == 200


@pytest.mark.asyncio
async def test_change_password_wrong_old(client: AsyncClient):
    await client.post(
        "/api/v1/auth/register",
        json={
            "fullname": "Wrong Old",
            "email": "wrongold@test.com",
            "password": "correctpass",
        },
    )
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "wrongold@test.com", "password": "correctpass"},
    )
    token = login_resp.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = await client.put(
        "/api/v1/auth/change-password",
        json={"old_password": "wrongpass", "new_password": "newpass456"},
        headers=headers,
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_login_invalid(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "nonexist@test.com",
            "password": "wrongpass",
        },
    )
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False
