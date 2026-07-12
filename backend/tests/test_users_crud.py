from __future__ import annotations

from datetime import datetime, timezone
import pytest
import pytest_asyncio
from bson import ObjectId
from httpx import AsyncClient
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.security import create_access_token, hash_password


@pytest_asyncio.fixture
async def test_user_token_custom(db: AsyncIOMotorDatabase) -> tuple[str, str]:
    user_id = str(ObjectId())
    now = datetime.now(timezone.utc)
    # Satisfies the user validation schema: required fields and valid role enum
    await db["users"].insert_one(
        {
            "_id": ObjectId(user_id),
            "user_code": "USR0001",
            "full_name": "Test Admin User",
            "email": "testadmin@test.com",
            "password_hash": hash_password("testpass123"),
            "role": "Admin",
            "created_at": now,
            "updated_at": now,
        }
    )
    token = create_access_token(sub=user_id, role="Admin")
    return token, user_id


@pytest_asyncio.fixture
async def auth_headers_custom(test_user_token_custom) -> dict[str, str]:
    token, _ = test_user_token_custom
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_create_user(client: AsyncClient, auth_headers_custom: dict):
    # 1. Create a user via POST
    response = await client.post(
        "/api/v1/users",
        json={
            "full_name": "John Doe",
            "email": "johndoe@example.com",
            "password": "securepassword",
            "role": "field_technician",
        },
        headers=auth_headers_custom,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["success"] is True
    assert body["data"]["full_name"] == "John Doe"
    assert body["data"]["email"] == "johndoe@example.com"
    assert body["data"]["role"] == "field_technician"
    assert "user_code" in body["data"]
    assert "password_hash" not in body["data"]


@pytest.mark.asyncio
async def test_list_users(client: AsyncClient, auth_headers_custom: dict):
    # List all users
    response = await client.get(
        "/api/v1/users",
        headers=auth_headers_custom,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    # Should at least contain the logged in admin user and any others
    assert body["data"]["total"] >= 1
    assert len(body["data"]["items"]) >= 1


@pytest.mark.asyncio
async def test_get_user(client: AsyncClient, auth_headers_custom: dict):
    # First create a user
    create_resp = await client.post(
        "/api/v1/users",
        json={
            "full_name": "Alice Smith",
            "email": "alice@example.com",
            "password": "alicepassword",
            "role": "farm_manager",
        },
        headers=auth_headers_custom,
    )
    user_id = create_resp.json()["data"]["id"]

    # Retrieve the user by ID
    response = await client.get(
        f"/api/v1/users/{user_id}",
        headers=auth_headers_custom,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["full_name"] == "Alice Smith"
    assert body["data"]["role"] == "farm_manager"


@pytest.mark.asyncio
async def test_update_user(client: AsyncClient, auth_headers_custom: dict):
    # First create a user
    create_resp = await client.post(
        "/api/v1/users",
        json={
            "full_name": "Bob Jones",
            "email": "bob@example.com",
            "password": "bobpassword",
            "role": "farmer",
        },
        headers=auth_headers_custom,
    )
    user_id = create_resp.json()["data"]["id"]

    # Update the user
    response = await client.put(
        f"/api/v1/users/{user_id}",
        json={
            "full_name": "Bobby Jones",
            "role": "enterprise_admin",
        },
        headers=auth_headers_custom,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["full_name"] == "Bobby Jones"
    assert body["data"]["role"] == "enterprise_admin"


@pytest.mark.asyncio
async def test_delete_user(client: AsyncClient, auth_headers_custom: dict):
    # First create a user
    create_resp = await client.post(
        "/api/v1/users",
        json={
            "full_name": "Charlie Brown",
            "email": "charlie@example.com",
            "password": "charliepassword",
            "role": "field_technician",
        },
        headers=auth_headers_custom,
    )
    user_id = create_resp.json()["data"]["id"]

    # Delete the user
    response = await client.delete(
        f"/api/v1/users/{user_id}",
        headers=auth_headers_custom,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["message"] == "User deleted"

    # Verify user is gone
    get_resp = await client.get(
        f"/api/v1/users/{user_id}",
        headers=auth_headers_custom,
    )
    assert get_resp.status_code == 404
