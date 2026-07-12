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

    # Generate token matching the user's role (mapped from Inspector to field_technician)
    token = create_access_token(sub=str(user_id), role="Inspector")

    return {
        "user_id": str(user_id),
        "farm_id": str(farm_id),
        "zone_id": str(zone_id),
        "tree_id": str(tree_id),
        "token": token,
        "headers": {"Authorization": f"Bearer {token}"}
    }


@pytest.mark.asyncio
async def test_create_inspection(client: AsyncClient, seeded_data: dict):
    response = await client.post(
        "/api/v1/inspections",
        json={
            "inspection_code": "INSP_T001",
            "farm_id": seeded_data["farm_id"],
            "zone_id": seeded_data["zone_id"],
            "tree_id": seeded_data["tree_id"],
            "inspection_date": datetime.now(timezone.utc).isoformat(),
            "temperature": 27.5,
            "humidity": 82.0,
            "rainfall": 15.4,
            "confidence": 92.5,
            "predicted_disease": "healthy",
            "health_status": "Healthy"
        },
        headers=seeded_data["headers"],
    )
    assert response.status_code == 201
    body = response.json()
    assert body["success"] is True
    assert body["data"]["inspection_code"] == "INSP_T001"
    assert body["data"]["tree_id"] == seeded_data["tree_id"]
    assert body["data"]["health_status"] == "Healthy"


@pytest.mark.asyncio
async def test_list_inspections(client: AsyncClient, seeded_data: dict):
    # First create an inspection
    await client.post(
        "/api/v1/inspections",
        json={
            "inspection_code": "INSP_T002",
            "farm_id": seeded_data["farm_id"],
            "zone_id": seeded_data["zone_id"],
            "tree_id": seeded_data["tree_id"],
            "inspection_date": datetime.now(timezone.utc).isoformat(),
            "temperature": 26.0,
            "humidity": 85.0,
            "rainfall": 5.0,
            "confidence": 88.0,
            "predicted_disease": "healthy",
            "health_status": "Healthy"
        },
        headers=seeded_data["headers"],
    )

    # Get list
    response = await client.get(
        "/api/v1/inspections",
        headers=seeded_data["headers"],
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["total"] >= 1
    assert len(body["data"]["items"]) >= 1


@pytest.mark.asyncio
async def test_get_inspection(client: AsyncClient, seeded_data: dict):
    # First create an inspection
    create_resp = await client.post(
        "/api/v1/inspections",
        json={
            "inspection_code": "INSP_T003",
            "farm_id": seeded_data["farm_id"],
            "zone_id": seeded_data["zone_id"],
            "tree_id": seeded_data["tree_id"],
            "inspection_date": datetime.now(timezone.utc).isoformat(),
            "temperature": 29.0,
            "humidity": 78.0,
            "rainfall": 0.0,
            "confidence": 95.0,
            "predicted_disease": "healthy",
            "health_status": "Healthy"
        },
        headers=seeded_data["headers"],
    )
    insp_id = create_resp.json()["data"]["id"]

    # Get inspection by id
    response = await client.get(
        f"/api/v1/inspections/{insp_id}",
        headers=seeded_data["headers"],
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["inspection_code"] == "INSP_T003"


@pytest.mark.asyncio
async def test_update_inspection(client: AsyncClient, seeded_data: dict):
    # First create an inspection
    create_resp = await client.post(
        "/api/v1/inspections",
        json={
            "inspection_code": "INSP_T004",
            "farm_id": seeded_data["farm_id"],
            "zone_id": seeded_data["zone_id"],
            "tree_id": seeded_data["tree_id"],
            "inspection_date": datetime.now(timezone.utc).isoformat(),
            "temperature": 30.0,
            "humidity": 75.0,
            "rainfall": 20.0,
            "confidence": 70.0,
            "predicted_disease": "Leaf Blight",
            "health_status": "Diseased"
        },
        headers=seeded_data["headers"],
    )
    insp_id = create_resp.json()["data"]["id"]

    # Update inspection
    response = await client.put(
        f"/api/v1/inspections/{insp_id}",
        json={
            "confidence": 99.0,
            "health_status": "Healthy",
            "predicted_disease": "healthy"
        },
        headers=seeded_data["headers"],
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["confidence"] == 99.0
    assert body["data"]["health_status"] == "Healthy"


@pytest.mark.asyncio
async def test_delete_inspection(client: AsyncClient, seeded_data: dict):
    # First create an inspection
    create_resp = await client.post(
        "/api/v1/inspections",
        json={
            "inspection_code": "INSP_T005",
            "farm_id": seeded_data["farm_id"],
            "zone_id": seeded_data["zone_id"],
            "tree_id": seeded_data["tree_id"],
            "inspection_date": datetime.now(timezone.utc).isoformat(),
            "temperature": 28.0,
            "humidity": 80.0,
            "rainfall": 10.0,
            "confidence": 85.0,
            "predicted_disease": "healthy",
            "health_status": "Healthy"
        },
        headers=seeded_data["headers"],
    )
    insp_id = create_resp.json()["data"]["id"]

    # Delete inspection
    response = await client.delete(
        f"/api/v1/inspections/{insp_id}",
        headers=seeded_data["headers"],
    )
    assert response.status_code == 200
    body = response.json()
    assert body["message"] == "Inspection deleted"

    # Verify deleted
    get_resp = await client.get(
        f"/api/v1/inspections/{insp_id}",
        headers=seeded_data["headers"],
    )
    assert get_resp.status_code == 404
