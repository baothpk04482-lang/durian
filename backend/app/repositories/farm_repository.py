from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.repositories.base import BaseRepository


class FarmRepository(BaseRepository):
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        super().__init__(db, "farms")

    async def exists_by_id(self, farm_id: str) -> bool:
        from bson import ObjectId
        if not ObjectId.is_valid(farm_id):
            return False
        return await self.collection.find_one({"_id": ObjectId(farm_id)}) is not None

    async def list_by_owner(
        self, owner_id: str, page: int = 1, per_page: int = 20, keyword: str | None = None
    ) -> tuple[list[dict], int]:
        import re
        from bson import ObjectId

        db = self.collection.database
        user = await db["users"].find_one({"_id": ObjectId(owner_id)})

        if not user:
            return [], 0

        user_company = user.get("company_id")
        if user_company:
            filter_query: dict = {"company_id": user_company}
        else:
            filter_query = {}

        if keyword:
            filter_query["farm_name"] = {"$regex": re.escape(keyword), "$options": "i"}
        return await self.list(
            filter_query=filter_query,
            page=page,
            per_page=per_page,
            sort=[("farm_code", 1)],
        )
