from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.repositories.base import BaseRepository


class UserRepository(BaseRepository):
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        super().__init__(db, "users")

    async def get_by_email(self, email: str) -> dict | None:
        doc = await self.collection.find_one({"email": email})
        if doc:
            return self._serialize(doc)
        return None

    async def update_refresh_token(
        self, user_id: str, refresh_token: str
    ) -> None:
        await self.collection.update_one(
            {"_id": self._to_oid(user_id)},
            {"$set": {"refresh_token": refresh_token}},
        )

    async def get_all(
        self, page: int = 1, per_page: int = 20, keyword: str | None = None
    ) -> tuple[list[dict], int]:
        import re
        filter_query: dict = {}
        if keyword:
            filter_query["$or"] = [
                {"full_name": {"$regex": re.escape(keyword), "$options": "i"}},
                {"email": {"$regex": re.escape(keyword), "$options": "i"}},
                {"user_code": {"$regex": re.escape(keyword), "$options": "i"}},
            ]
        return await self.list(
            filter_query=filter_query,
            page=page,
            per_page=per_page,
            sort=[("user_code", 1)],
        )

    async def get_by_id(self, id: str) -> dict | None:
        return await self.get(id)

    async def count_all(self) -> int:
        return await self.collection.count_documents({})

    async def exists_by_user_code(self, user_code: str) -> bool:
        return await self.collection.find_one({"user_code": user_code}) is not None

    def _to_oid(self, id: str):
        from bson import ObjectId
        return ObjectId(id)
