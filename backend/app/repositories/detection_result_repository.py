from __future__ import annotations

from typing import Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.repositories.base import BaseRepository


class DetectionResultRepository(BaseRepository):
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        super().__init__(db, "detection_results")

    def _build_enrichment_stages(self) -> list[dict]:
        return [
            {
                "$lookup": {
                    "from": "inspections",
                    "localField": "inspection_id",
                    "foreignField": "_id",
                    "as": "inspection_info",
                }
            },
            {"$unwind": {"path": "$inspection_info", "preserveNullAndEmptyArrays": True}},
            {
                "$addFields": {
                    "inspection_code": "$inspection_info.inspection_code",
                }
            },
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
                "$addFields": {
                    "tree_code": "$tree_info.tree_code",
                }
            },
            {"$project": {"inspection_info": 0, "tree_info": 0}},
        ]

    async def get_all(
        self, page: int = 1, per_page: int = 20, keyword: str | None = None
    ) -> tuple[list[dict[str, Any]], int]:
        import re
        filter_query: dict = {}
        if keyword:
            filter_query["$or"] = [
                {"model": {"$regex": re.escape(keyword), "$options": "i"}},
                {"prediction": {"$regex": re.escape(keyword), "$options": "i"}},
            ]
        pipeline = [{"$match": filter_query}, {"$sort": {"created_at": -1}}]
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
