from __future__ import annotations

from typing import Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.repositories.base import BaseRepository


class DiseasesRepository(BaseRepository):
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        super().__init__(db, "diseases")

    async def get_all(
        self, page: int = 1, per_page: int = 20, keyword: str | None = None
    ) -> tuple[list[dict[str, Any]], int]:
        import re
        filter_query: dict = {}
        if keyword:
            filter_query["$or"] = [
                {"code": {"$regex": re.escape(keyword), "$options": "i"}},
                {"name": {"$regex": re.escape(keyword), "$options": "i"}},
                {"affected_part": {"$regex": re.escape(keyword), "$options": "i"}},
            ]

        return await self.list(
            filter_query=filter_query,
            page=page,
            per_page=per_page,
            sort=[("code", 1)],
        )

    async def get_by_id(self, id: str) -> dict[str, Any] | None:
        return await self.get(id)

    async def exists_by_code(self, code: str, exclude_id: str | None = None) -> bool:
        query: dict[str, Any] = {"code": code}
        if exclude_id:
            from bson import ObjectId
            query["_id"] = {"$ne": ObjectId(exclude_id)}
        return await self.collection.find_one(query) is not None
