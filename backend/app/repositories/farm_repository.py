from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.repositories.base import BaseRepository


class FarmRepository(BaseRepository):
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        super().__init__(db, "farms")

    async def list_by_owner(
        self, owner_id: str, page: int = 1, per_page: int = 20, keyword: str | None = None
    ) -> tuple[list[dict], int]:
        import re
        from bson import ObjectId

        company_oid = ObjectId(owner_id) if ObjectId.is_valid(owner_id) else owner_id
        filter_query: dict = {"company_id": company_oid}
        if keyword:
            filter_query["farm_name"] = {"$regex": re.escape(keyword), "$options": "i"}
        return await self.list(
            filter_query=filter_query,
            page=page,
            per_page=per_page,
            sort=[("farm_code", 1)],
        )
