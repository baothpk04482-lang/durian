from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.repositories.base import BaseRepository


class ZoneRepository(BaseRepository):
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        super().__init__(db, "zones")

    async def exists_by_id(self, zone_id: str) -> bool:
        from bson import ObjectId
        if not ObjectId.is_valid(zone_id):
            return False
        return await self.collection.find_one({"_id": ObjectId(zone_id)}) is not None

    async def get_farm_id(self, zone_id: str) -> str | None:
        from bson import ObjectId
        if not ObjectId.is_valid(zone_id):
            return None
        doc = await self.collection.find_one({"_id": ObjectId(zone_id)}, {"farm_id": 1})
        if doc and "farm_id" in doc:
            return str(doc["farm_id"])
        return None

    async def list_by_farm(
        self, farm_id: str, page: int = 1, per_page: int = 20, keyword: str | None = None
    ) -> tuple[list[dict], int]:
        import re
        from bson import ObjectId

        farm_oid = ObjectId(farm_id) if ObjectId.is_valid(farm_id) else farm_id
        filter_query: dict = {"farm_id": farm_oid}
        if keyword:
            filter_query["zone_name"] = {"$regex": re.escape(keyword), "$options": "i"}
        return await self.list(
            filter_query=filter_query,
            page=page,
            per_page=per_page,
            sort=[("zone_code", 1)],
        )
