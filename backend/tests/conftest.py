from __future__ import annotations

from datetime import datetime, timezone
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from bson.objectid import ObjectId
from httpx import ASGITransport, AsyncClient
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.security import create_access_token, hash_password
from app.database.mongodb import MongoDBManager
from app.main import app


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    MongoDBManager._client = None
    MongoDBManager._db = None
    client = MongoDBManager.get_client()
    db = MongoDBManager.get_db()
    collections = await db.list_collection_names()
    for col in collections:
        await db[col].delete_many({})
    yield
    await MongoDBManager.close()


@pytest_asyncio.fixture
async def db() -> AsyncIOMotorDatabase:
    return MongoDBManager.get_db()


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport, base_url="http://test"
    ) as ac:
        yield ac


@pytest_asyncio.fixture
async def test_user_token(db: AsyncIOMotorDatabase) -> tuple[str, str]:
    user_id = str(ObjectId())
    now = datetime.now(timezone.utc)
    await db["users"].insert_one(
        {
            "_id": ObjectId(user_id),
            "full_name": "Test Farmer",
            "email": "farmer@test.com",
            "password_hash": hash_password("testpass123"),
            "role": "Technician",
            "created_at": now,
            "updated_at": now,
        }
    )
    token = create_access_token(sub=user_id, role="Technician")
    return token, user_id


@pytest_asyncio.fixture
async def auth_headers(test_user_token) -> dict[str, str]:
    token, _ = test_user_token
    return {"Authorization": f"Bearer {token}"}
