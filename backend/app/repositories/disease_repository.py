from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.repositories.base import BaseRepository


class DiseaseRepository(BaseRepository):
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        super().__init__(db, "disease_history")

    async def list_by_tree(
        self, tree_id: str, page: int = 1, per_page: int = 20
    ) -> tuple[list[dict], int]:
        from bson import ObjectId
        tree_oid = ObjectId(tree_id) if ObjectId.is_valid(tree_id) else tree_id
        return await self.list(
            filter_query={"tree_id": tree_oid},
            page=page,
            per_page=per_page,
            sort=[("created_at", -1)],
        )

    async def get_latest_by_tree(self, tree_id: str) -> dict | None:
        from bson import ObjectId
        tree_oid = ObjectId(tree_id) if ObjectId.is_valid(tree_id) else tree_id
        cursor = (
            self.collection.find({"tree_id": tree_oid})
            .sort("created_at", -1)
            .limit(1)
        )
        doc = await cursor.to_list(length=1)
        if doc:
            return self._serialize(doc[0])
        return None

    async def count_diseased(self) -> int:
        pipeline = [
            {"$match": {"disease": {"$ne": "Healthy"}}},
            {"$group": {"_id": "$tree_id"}},
            {"$count": "count"},
        ]
        cursor = self.collection.aggregate(pipeline)
        result = await cursor.to_list(length=1)
        return result[0]["count"] if result else 0

    async def count_all(self) -> int:
        return await self.collection.count_documents({})
