from __future__ import annotations

from datetime import datetime, timezone

import pytest
from httpx import AsyncClient
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.security import decode_token
from app.database.mongodb import MongoDBManager


def _user_id_from_headers(headers: dict[str, str]) -> str:
    token = headers["Authorization"].replace("Bearer ", "")
    payload = decode_token(token)
    return payload["sub"]


@pytest.mark.asyncio
async def test_image_quality(
    client: AsyncClient, auth_headers: dict[str, str]
):
    resp = await client.post(
        "/api/v1/ai/image-quality",
        files={"file": ("test.jpg", b"fake-image-bytes", "image/jpeg")},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert body["message"] == "Image quality checked"
    assert body["data"]["blur"] is False
    assert body["data"]["brightness"] == "good"
    assert body["data"]["leaf_detected"] is True
    assert body["data"]["passed"] is True


@pytest.mark.asyncio
async def test_image_quality_no_file(
    client: AsyncClient, auth_headers: dict[str, str]
):
    resp = await client.post(
        "/api/v1/ai/image-quality",
        headers=auth_headers,
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_dashboard_heatmap(
    client: AsyncClient, auth_headers: dict[str, str]
):
    resp = await client.get(
        "/api/v1/dashboard/heatmap",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert isinstance(body["data"], list)
    if body["data"]:
        item = body["data"][0]
        assert "tree_id" in item
        assert "lat" in item
        assert "lng" in item
        assert "risk" in item
        assert "status" in item


@pytest.mark.asyncio
async def test_notifications_unread(
    client: AsyncClient, auth_headers: dict[str, str]
):
    db = MongoDBManager.get_db()
    now = datetime.now(timezone.utc)
    await db["notifications"].insert_one(
        {
            "farm_id": "1",
            "title": "Test Alert",
            "content": "Something happened",
            "status": "unread",
            "created_at": now,
            "updated_at": now,
        }
    )
    await db["notifications"].insert_one(
        {
            "farm_id": "1",
            "title": "Read Alert",
            "content": "Already read",
            "status": "read",
            "created_at": now,
            "updated_at": now,
        }
    )
    resp = await client.get(
        "/api/v1/notifications/unread",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert body["data"]["total"] == 1
    assert body["data"]["items"][0]["status"] == "unread"


@pytest.mark.asyncio
async def test_trees_filter_by_keyword(
    client: AsyncClient, auth_headers: dict[str, str]
):
    db = MongoDBManager.get_db()
    now = datetime.now(timezone.utc)
    await db["trees"].insert_one(
        {
            "zone_id": "1",
            "tree_code": "D001",
            "variety": "Monthong",
            "created_at": now,
            "updated_at": now,
        }
    )
    await db["trees"].insert_one(
        {
            "zone_id": "1",
            "tree_code": "A002",
            "variety": "Chanee",
            "created_at": now,
            "updated_at": now,
        }
    )
    resp = await client.get(
        "/api/v1/trees?keyword=D001",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["data"]["total"] == 1


@pytest.mark.asyncio
async def test_farms_search_keyword(
    client: AsyncClient, auth_headers: dict[str, str]
):
    db = MongoDBManager.get_db()
    owner_id = _user_id_from_headers(auth_headers)
    now = datetime.now(timezone.utc)
    await db["farms"].insert_one(
        {
            "name": "Durian Farm A",
            "address": "Vietnam",
            "area": 10,
            "owner_id": owner_id,
            "created_at": now,
            "updated_at": now,
        }
    )
    await db["farms"].insert_one(
        {
            "name": "Mango Farm B",
            "address": "Thailand",
            "area": 20,
            "owner_id": owner_id,
            "created_at": now,
            "updated_at": now,
        }
    )
    resp = await client.get(
        "/api/v1/farms?keyword=Durian",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["data"]["total"] == 1


@pytest.mark.asyncio
async def test_zones_search_keyword(
    client: AsyncClient, auth_headers: dict[str, str]
):
    db = MongoDBManager.get_db()
    now = datetime.now(timezone.utc)
    await db["zones"].insert_one(
        {
            "farm_id": "1",
            "name": "Zone A",
            "created_at": now,
            "updated_at": now,
        }
    )
    await db["zones"].insert_one(
        {
            "farm_id": "1",
            "name": "Zone B",
            "created_at": now,
            "updated_at": now,
        }
    )
    resp = await client.get(
        "/api/v1/zones?keyword=Zone A",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["data"]["total"] == 1
