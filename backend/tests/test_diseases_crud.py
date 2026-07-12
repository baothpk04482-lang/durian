from __future__ import annotations

from datetime import datetime, timezone
import pytest
import pytest_asyncio
from bson import ObjectId
from httpx import AsyncClient
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.security import create_access_token, hash_password


@pytest_asyncio.fixture
async def seeded_data(db: AsyncIOMotorDatabase) -> dict:
    now = datetime.now(timezone.utc)

    # 1. Insert User (the Inspector)
    user_id = ObjectId()
    await db["users"].insert_one({
        "_id": user_id,
        "user_code": "USR0001",
        "full_name": "Seeded Inspector",
        "email": "inspector@test.com",
        "password_hash": hash_password("inspector123"),
        "role": "Inspector",
        "created_at": now,
    })

    token = create_access_token(sub=str(user_id), role="Inspector")

    return {
        "user_id": str(user_id),
        "token": token,
        "headers": {"Authorization": f"Bearer {token}"}
    }


@pytest.mark.asyncio
async def test_create_disease(client: AsyncClient, seeded_data: dict):
    response = await client.post(
        "/api/v1/diseases",
        json={
            "code": "test_disease_code",
            "name": "Test Disease Name",
            "affected_part": "leaf",
            "severity": "mild",
            "description": "A description",
            "recommendation": "A recommendation",
        },
        headers=seeded_data["headers"],
    )
    assert response.status_code == 201
    body = response.json()
    assert body["success"] is True
    assert body["data"]["code"] == "test_disease_code"
    assert body["data"]["name"] == "Test Disease Name"
    assert body["data"]["affected_part"] == "leaf"


@pytest.mark.asyncio
async def test_list_diseases(client: AsyncClient, seeded_data: dict):
    # Create one first
    await client.post(
        "/api/v1/diseases",
        json={
            "code": "list_test_disease",
            "name": "List Test Disease",
            "affected_part": "stem",
        },
        headers=seeded_data["headers"],
    )

    response = await client.get(
        "/api/v1/diseases",
        headers=seeded_data["headers"],
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["total"] >= 1
    assert len(body["data"]["items"]) >= 1


@pytest.mark.asyncio
async def test_get_disease(client: AsyncClient, seeded_data: dict):
    # Create one first
    create_resp = await client.post(
        "/api/v1/diseases",
        json={
            "code": "get_test_disease",
            "name": "Get Test Disease",
        },
        headers=seeded_data["headers"],
    )
    dis_id = create_resp.json()["data"]["id"]

    response = await client.get(
        f"/api/v1/diseases/{dis_id}",
        headers=seeded_data["headers"],
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["code"] == "get_test_disease"


@pytest.mark.asyncio
async def test_update_disease(client: AsyncClient, seeded_data: dict):
    # Create one first
    create_resp = await client.post(
        "/api/v1/diseases",
        json={
            "code": "update_test_disease",
            "name": "Update Test Disease",
        },
        headers=seeded_data["headers"],
    )
    dis_id = create_resp.json()["data"]["id"]

    # Update
    response = await client.put(
        f"/api/v1/diseases/{dis_id}",
        json={
            "name": "Updated Disease Name",
            "severity": "severe",
        },
        headers=seeded_data["headers"],
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["name"] == "Updated Disease Name"
    assert body["data"]["severity"] == "severe"


@pytest.mark.asyncio
async def test_delete_disease(client: AsyncClient, seeded_data: dict):
    # Create one first
    create_resp = await client.post(
        "/api/v1/diseases",
        json={
            "code": "delete_test_disease",
            "name": "Delete Test Disease",
        },
        headers=seeded_data["headers"],
    )
    dis_id = create_resp.json()["data"]["id"]

    # Delete
    response = await client.delete(
        f"/api/v1/diseases/{dis_id}",
        headers=seeded_data["headers"],
    )
    assert response.status_code == 200
    body = response.json()
    assert body["message"] == "Disease deleted"

    # Verify deleted
    get_resp = await client.get(
        f"/api/v1/diseases/{dis_id}",
        headers=seeded_data["headers"],
    )
    assert get_resp.status_code == 404
