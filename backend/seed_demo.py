"""Seed the demo user for competition demo mode.

Run: python seed_demo.py

Creates:
  Email:    bao@gmail.com
  Password: 123456
  Role:     Admin  (maps to enterprise_admin)
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone

from app.core.security import hash_password
from app.database.mongodb import MongoDBManager


async def seed() -> None:
    db = MongoDBManager.get_db()

    existing = await db["users"].find_one({"email": "bao@gmail.com"})
    if existing:
        print("Demo user already exists. Skipping.")
        return

    now = datetime.now(timezone.utc)

    count = await db["users"].count_documents({})
    user_code = f"USR{count + 1:04d}"

    await db["users"].insert_one(
        {
            "user_code": user_code,
            "full_name": "Bao Admin",
            "fullname": "Bao Admin",
            "email": "bao@gmail.com",
            "password_hash": hash_password("123456"),
            "role": "Admin",
            "refresh_token": "",
            "created_at": now,
            "updated_at": now,
        }
    )
    print("Demo user created:")
    print("  Email:    bao@gmail.com")
    print("  Password: 123456")
    print("  Role:     Admin")
    print(f"  Code:     {user_code}")

    await MongoDBManager.close()


if __name__ == "__main__":
    asyncio.run(seed())
