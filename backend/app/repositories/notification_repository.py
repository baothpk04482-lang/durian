from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.repositories.base import BaseRepository


class NotificationRepository(BaseRepository):
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        super().__init__(db, "alerts")

    async def get_latest(self) -> dict | None:
        cursor = (
            self.collection.find()
            .sort("created_at", -1)
            .limit(1)
        )
        doc = await cursor.to_list(length=1)
        if doc:
            return self._serialize(doc[0])
        return None
