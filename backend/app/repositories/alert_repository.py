from __future__ import annotations

import re
from typing import Any
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.repositories.base import BaseRepository


class AlertRepository(BaseRepository):
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        super().__init__(db, "alerts")

    async def get_all(
        self, page: int = 1, per_page: int = 20, keyword: str | None = None
    ) -> tuple[list[dict[str, Any]], int]:
        filter_query: dict = {}
        if keyword:
            conditions: list[dict] = [
                {"alert_type": {"$regex": re.escape(keyword), "$options": "i"}},
                {"priority": {"$regex": re.escape(keyword), "$options": "i"}},
            ]

            if ObjectId.is_valid(keyword):
                conditions.append({"farm_id": ObjectId(keyword)})
                conditions.append({"tree_id": ObjectId(keyword)})

            # Resolve matching farm IDs
            matching_farm_ids = []
            cursor_farms = self.collection.database["farms"].find(
                {
                    "$or": [
                        {"farm_code": {"$regex": re.escape(keyword), "$options": "i"}},
                        {"farm_name": {"$regex": re.escape(keyword), "$options": "i"}},
                    ]
                },
                {"_id": 1}
            )
            async for f in cursor_farms:
                matching_farm_ids.append(f["_id"])
            if matching_farm_ids:
                conditions.append({"farm_id": {"$in": matching_farm_ids}})

            # Resolve matching tree IDs
            matching_tree_ids = []
            cursor_trees = self.collection.database["trees"].find(
                {"tree_code": {"$regex": re.escape(keyword), "$options": "i"}},
                {"_id": 1}
            )
            async for t in cursor_trees:
                matching_tree_ids.append(t["_id"])
            if matching_tree_ids:
                conditions.append({"tree_id": {"$in": matching_tree_ids}})

            filter_query["$or"] = conditions

        return await self.list(
            filter_query=filter_query,
            page=page,
            per_page=per_page,
            sort=[("date", -1)],
        )

    async def get_by_id(self, id: str) -> dict[str, Any] | None:
        return await self.get(id)
