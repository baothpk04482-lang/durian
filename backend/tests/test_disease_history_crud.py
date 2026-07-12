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

    # 2. Insert Company
    company_id = ObjectId()
    await db["companies"].insert_one({
        "_id": company_id,
        "company_code": "COMP001",
        "company_name": "Test Company",
        "district": "Krong Pac",
        "province": "Dak Lak",
        "created_at": now,
    })

    # 3. Insert Farm
    farm_id = ObjectId()
    await db["farms"].insert_one({
        "_id": farm_id,
        "farm_code": "FARM001",
        "farm_name": "Test Farm",
        "company_id": company_id,
        "district": "Krong Pac",
        "created_at": now,
    })

    # 4. Insert Zone
    zone_id = ObjectId()
    await db["zones"].insert_one({
        "_id": zone_id,
        "farm_id": farm_id,
        "zone_name": "ZONE_A",
        "tree_count": 10,
        "created_at": now,
    })

    # 5. Insert Tree
    tree_id = ObjectId()
    await db["trees"].insert_one({
        "_id": tree_id,
        "tree_code": "TREE00001",
        "farm_id": farm_id,
        "zone_id": zone_id,
        "variety": "Monthong",
        "planting_date": now,
        "tree_age": 5,
        "status": "Healthy",
        "created_at": now,
    })

    token = create_access_token(sub=str(user_id), role="Inspector")

    return {
        "user_id": str(user_id),
        "tree_id": str(tree_id),
        "token": token,
        "headers": {"Authorization": f"Bearer {token}"}
    }


@pytest.mark.asyncio
async def test_create_disease_history(client: AsyncClient, seeded_data: dict):
    response = await client.post(
        "/api/v1/disease-history",
        json={
            "tree_id": seeded_data["tree_id"],
            "disease": "Leaf Spot",
            "date": datetime.now(timezone.utc).isoformat(),
            "action": "Treatment Applied",
        },
        headers=seeded_data["headers"],
    )
    assert response.status_code == 201
    body = response.json()
    assert body["success"] is True
    assert body["data"]["tree_id"] == seeded_data["tree_id"]
    assert body["data"]["disease"] == "Leaf Spot"
    assert body["data"]["action"] == "Treatment Applied"


@pytest.mark.asyncio
async def test_list_disease_history(client: AsyncClient, seeded_data: dict):
    # Create one first
    await client.post(
        "/api/v1/disease-history",
        json={
            "tree_id": seeded_data["tree_id"],
            "disease": "Anthracnose",
            "date": datetime.now(timezone.utc).isoformat(),
            "action": "Pruning and Fungicide",
        },
        headers=seeded_data["headers"],
    )

    response = await client.get(
        "/api/v1/disease-history",
        headers=seeded_data["headers"],
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["total"] >= 1
    assert len(body["data"]["items"]) >= 1


@pytest.mark.asyncio
async def test_get_disease_history(client: AsyncClient, seeded_data: dict):
    # Create one first
    create_resp = await client.post(
        "/api/v1/disease-history",
        json={
            "tree_id": seeded_data["tree_id"],
            "disease": "Phytophthora",
            "date": datetime.now(timezone.utc).isoformat(),
            "action": "Chemical Injection",
        },
        headers=seeded_data["headers"],
    )
    hist_id = create_resp.json()["data"]["id"]

    response = await client.get(
        f"/api/v1/disease-history/{hist_id}",
        headers=seeded_data["headers"],
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["disease"] == "Phytophthora"


@pytest.mark.asyncio
async def test_update_disease_history(client: AsyncClient, seeded_data: dict):
    # Create one first
    create_resp = await client.post(
        "/api/v1/disease-history",
        json={
            "tree_id": seeded_data["tree_id"],
            "disease": "Leaf Spot",
            "date": datetime.now(timezone.utc).isoformat(),
            "action": "Treatment Applied",
        },
        headers=seeded_data["headers"],
    )
    hist_id = create_resp.json()["data"]["id"]

    # Update
    response = await client.put(
        f"/api/v1/disease-history/{hist_id}",
        json={
            "disease": "Leaf Blight",
            "action": "Fungicide Spray",
        },
        headers=seeded_data["headers"],
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["disease"] == "Leaf Blight"
    assert body["data"]["action"] == "Fungicide Spray"


@pytest.mark.asyncio
async def test_delete_disease_history(client: AsyncClient, seeded_data: dict):
    # Create one first
    create_resp = await client.post(
        "/api/v1/disease-history",
        json={
            "tree_id": seeded_data["tree_id"],
            "disease": "Anthracnose",
            "date": datetime.now(timezone.utc).isoformat(),
            "action": "Pruning",
        },
        headers=seeded_data["headers"],
    )
    hist_id = create_resp.json()["data"]["id"]

    # Delete
    response = await client.delete(
        f"/api/v1/disease-history/{hist_id}",
        headers=seeded_data["headers"],
    )
    assert response.status_code == 200
    body = response.json()
    assert body["message"] == "Disease history record deleted"

    # Verify deleted
    get_resp = await client.get(
        f"/api/v1/disease-history/{hist_id}",
        headers=seeded_data["headers"],
    )
    assert get_resp.status_code == 404
