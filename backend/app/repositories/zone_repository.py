from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.repositories.base import BaseRepository


class ZoneRepository(BaseRepository):
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        super().__init__(db, "zones")

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
