from __future__ import annotations

from typing import Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from app.repositories.base import BaseRepository


class InspectionRepository(BaseRepository):
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        super().__init__(db, "inspections")

    async def exists_by_id(self, inspection_id: str) -> bool:
        from bson import ObjectId
        if not ObjectId.is_valid(inspection_id):
            return False
        return await self.collection.find_one({"_id": ObjectId(inspection_id)}) is not None

    def _build_enrichment_stages(self) -> list[dict]:
        return [
            {
                "$lookup": {
                    "from": "trees",
                    "localField": "tree_id",
                    "foreignField": "_id",
                    "as": "tree_info",
                }
            },
            {"$unwind": {"path": "$tree_info", "preserveNullAndEmptyArrays": True}},
            {
                "$lookup": {
                    "from": "users",
                    "localField": "inspector_id",
                    "foreignField": "_id",
                    "as": "user_info",
                }
            },
            {"$unwind": {"path": "$user_info", "preserveNullAndEmptyArrays": True}},
            {
                "$addFields": {
                    "tree_code": "$tree_info.tree_code",
                    "inspector_name": "$user_info.full_name",
                }
            },
            {"$project": {"tree_info": 0, "user_info": 0}},
        ]

    async def get_all(
        self, page: int = 1, per_page: int = 20, keyword: str | None = None
    ) -> tuple[list[dict[str, Any]], int]:
        import re
        filter_query: dict = {}
        if keyword:
            conditions: list[dict] = [
                {"inspection_code": {"$regex": re.escape(keyword), "$options": "i"}},
                {"health_status": {"$regex": re.escape(keyword), "$options": "i"}},
            ]

            # Resolve tree_ids from tree_code matching keyword
            matching_tree_ids = []
            cursor = self.collection.database["trees"].find(
                {"tree_code": {"$regex": re.escape(keyword), "$options": "i"}},
                {"_id": 1}
            )
            async for t in cursor:
                matching_tree_ids.append(t["_id"])

            if matching_tree_ids:
                conditions.append({"tree_id": {"$in": matching_tree_ids}})

            filter_query["$or"] = conditions

        pipeline = [{"$match": filter_query}, {"$sort": {"inspection_code": 1}}]
        pipeline.extend(self._build_enrichment_stages())

        count_pipeline = [{"$match": filter_query}, {"$count": "total"}]
        count_cursor = self.collection.aggregate(count_pipeline)
        count_result = await count_cursor.to_list(length=1)
        total = count_result[0]["total"] if count_result else 0

        pipeline.append({"$skip": (page - 1) * per_page})
        pipeline.append({"$limit": per_page})

        cursor = self.collection.aggregate(pipeline)
        items = []
        async for doc in cursor:
            doc["id"] = str(doc.pop("_id"))
            items.append(doc)
        return items, total

    async def get_by_id(self, id: str) -> dict[str, Any] | None:
        return await self.get(id)
