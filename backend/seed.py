from __future__ import annotations

import asyncio
from datetime import datetime, timezone

from app.core.config import settings
from app.core.security import hash_password
from app.database.mongodb import MongoDBManager


async def seed() -> None:
    db = MongoDBManager.get_db()

    existing = await db["users"].find_one({"email": "admin@durian.ai"})
    if existing:
        print("Admin user already exists. Skipping.")
        return

    now = datetime.now(timezone.utc)
    await db["users"].insert_one(
        {
            "fullname": "Admin DGA",
            "email": "admin@durian.ai",
            "password_hash": hash_password("admin123"),
            "role": "enterprise_admin",
            "created_at": now,
            "updated_at": now,
        }
    )
    print("Admin user created:")
    print("  Email: admin@durian.ai")
    print("  Password: admin123")
    print("  Role: enterprise_admin")

    farm_id = await db["farms"].insert_one(
        {
            "name": "Demo Farm",
            "address": "123 Durian Street, Vietnam",
            "area": 10.5,
            "owner_id": "",  # will be updated
            "created_at": now,
            "updated_at": now,
        }
    )
    print(f"Demo farm created with id: {farm_id.inserted_id}")

    await MongoDBManager.close()


if __name__ == "__main__":
    asyncio.run(seed())
