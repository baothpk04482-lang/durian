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

    # 6. Insert Inspection
    inspection_id = ObjectId()
    await db["inspections"].insert_one({
        "_id": inspection_id,
        "inspection_code": "INSP00001",
        "farm_id": farm_id,
        "zone_id": zone_id,
        "tree_id": tree_id,
        "inspection_date": now,
        "temperature": 28.0,
        "humidity": 80.0,
        "rainfall": 15.0,
        "confidence": 90.0,
        "predicted_disease": "healthy",
        "health_status": "Healthy",
        "created_at": now,
    })

    token = create_access_token(sub=str(user_id), role="Inspector")

    return {
        "user_id": str(user_id),
        "inspection_id": str(inspection_id),
        "token": token,
        "headers": {"Authorization": f"Bearer {token}"}
    }


@pytest.mark.asyncio
async def test_create_detection_result(client: AsyncClient, seeded_data: dict):
    response = await client.post(
        "/api/v1/detection-results",
        json={
            "inspection_id": seeded_data["inspection_id"],
            "model": "YOLOv11",
            "prediction": "Phytophthora",
            "confidence": 88.5,
        },
        headers=seeded_data["headers"],
    )
    assert response.status_code == 201
    body = response.json()
    assert body["success"] is True
    assert body["data"]["inspection_id"] == seeded_data["inspection_id"]
    assert body["data"]["model"] == "YOLOv11"
    assert body["data"]["confidence"] == 88.5


@pytest.mark.asyncio
async def test_list_detection_results(client: AsyncClient, seeded_data: dict):
    # Create one first
    await client.post(
        "/api/v1/detection-results",
        json={
            "inspection_id": seeded_data["inspection_id"],
            "model": "YOLOv11",
            "prediction": "Leaf Blight",
            "confidence": 91.2,
        },
        headers=seeded_data["headers"],
    )

    response = await client.get(
        "/api/v1/detection-results",
        headers=seeded_data["headers"],
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["total"] >= 1
    assert len(body["data"]["items"]) >= 1


@pytest.mark.asyncio
async def test_get_detection_result(client: AsyncClient, seeded_data: dict):
    # Create one first
    create_resp = await client.post(
        "/api/v1/detection-results",
        json={
            "inspection_id": seeded_data["inspection_id"],
            "model": "ResNet50",
            "prediction": "healthy",
            "confidence": 99.5,
        },
        headers=seeded_data["headers"],
    )
    det_id = create_resp.json()["data"]["id"]

    response = await client.get(
        f"/api/v1/detection-results/{det_id}",
        headers=seeded_data["headers"],
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["model"] == "ResNet50"


@pytest.mark.asyncio
async def test_update_detection_result(client: AsyncClient, seeded_data: dict):
    # Create one first
    create_resp = await client.post(
        "/api/v1/detection-results",
        json={
            "inspection_id": seeded_data["inspection_id"],
            "model": "YOLOv11",
            "prediction": "Anthracnose",
            "confidence": 75.4,
        },
        headers=seeded_data["headers"],
    )
    det_id = create_resp.json()["data"]["id"]

    # Update confidence and prediction
    response = await client.put(
        f"/api/v1/detection-results/{det_id}",
        json={
            "confidence": 95.0,
            "prediction": "healthy",
        },
        headers=seeded_data["headers"],
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["confidence"] == 95.0
    assert body["data"]["prediction"] == "healthy"


@pytest.mark.asyncio
async def test_delete_detection_result(client: AsyncClient, seeded_data: dict):
    # Create one first
    create_resp = await client.post(
        "/api/v1/detection-results",
        json={
            "inspection_id": seeded_data["inspection_id"],
            "model": "YOLOv8",
            "prediction": "healthy",
            "confidence": 85.0,
        },
        headers=seeded_data["headers"],
    )
    det_id = create_resp.json()["data"]["id"]

    # Delete it
    response = await client.delete(
        f"/api/v1/detection-results/{det_id}",
        headers=seeded_data["headers"],
    )
    assert response.status_code == 200
    body = response.json()
    assert body["message"] == "Detection result deleted"

    # Verify deleted
    get_resp = await client.get(
        f"/api/v1/detection-results/{det_id}",
        headers=seeded_data["headers"],
    )
    assert get_resp.status_code == 404
