from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.repositories.base import BaseRepository


class TreeRepository(BaseRepository):
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        super().__init__(db, "trees")

    def _build_enrichment_stages(self) -> list[dict]:
        return [
            {
                "$lookup": {
                    "from": "zones",
                    "localField": "zone_id",
                    "foreignField": "_id",
                    "as": "zone_info",
                }
            },
            {"$unwind": {"path": "$zone_info", "preserveNullAndEmptyArrays": True}},
            {
                "$lookup": {
                    "from": "farms",
                    "localField": "zone_info.farm_id",
                    "foreignField": "_id",
                    "as": "farm_info",
                }
            },
            {"$unwind": {"path": "$farm_info", "preserveNullAndEmptyArrays": True}},
            {
                "$addFields": {
                    "farm_name": "$farm_info.farm_name",
                    "zone_name": "$zone_info.zone_name",
                    "zone_code": "$zone_info.zone_code",
                }
            },
            {"$project": {"zone_info": 0, "farm_info": 0}},
        ]

    async def list_by_zone(
        self, zone_id: str, page: int = 1, per_page: int = 20
    ) -> tuple[list[dict], int]:
        from bson import ObjectId
        zone_oid = ObjectId(zone_id) if ObjectId.is_valid(zone_id) else zone_id
        return await self.list(
            filter_query={"zone_id": zone_oid},
            page=page,
            per_page=per_page,
            sort=[("tree_code", 1)],
        )

    async def list_filtered(
        self,
        zone_id: str | None = None,
        farm_id: str | None = None,
        keyword: str | None = None,
        status: str | None = None,
        risk_level: str | None = None,
        page: int = 1,
        per_page: int = 20,
    ) -> tuple[list[dict], int]:
        import re
        from bson import ObjectId

        filter_query: dict = {}
        if zone_id:
            filter_query["zone_id"] = ObjectId(zone_id) if ObjectId.is_valid(zone_id) else zone_id

        if keyword:
            filter_query["tree_code"] = {"$regex": re.escape(keyword), "$options": "i"}

        if farm_id:
            db = self.collection.database
            farm_oid = ObjectId(farm_id) if ObjectId.is_valid(farm_id) else farm_id
            zone_ids = []
            async for z in db["zones"].find({"farm_id": farm_oid}):
                zone_ids.append(z["_id"])
            if zone_ids:
                filter_query["zone_id"] = {"$in": zone_ids}
            else:
                return [], 0

        if status:
            return await self._list_with_joins(
                filter_query, status, risk_level, page, per_page
            )

        enrich_stages = self._build_enrichment_stages()
        pipeline = [{"$match": filter_query}, {"$sort": {"tree_code": 1}}]
        pipeline.extend(enrich_stages)

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

    async def _list_with_joins(
        self,
        base_query: dict,
        status: str | None,
        risk_level: str | None,
        page: int,
        per_page: int,
    ) -> tuple[list[dict], int]:
        db = self.collection.database
        pipeline: list[dict] = [{"$match": base_query}] if base_query else []

        pipeline.append({"$sort": {"tree_code": 1}})

        if status:
            lookup_disease = {
                "$lookup": {
                    "from": "disease_history",
                    "let": {"tree_id": "$_id"},
                    "pipeline": [
                        {"$match": {"$expr": {"$eq": ["$tree_id", "$$tree_id"]}}},
                        {"$sort": {"created_at": -1}},
                        {"$limit": 1},
                    ],
                    "as": "latest_disease",
                }
            }
            pipeline.append(lookup_disease)
            if status == "healthy":
                pipeline.append({"$match": {"latest_disease.disease": "Healthy"}})
            elif status == "diseased":
                pipeline.append({
                    "$match": {
                        "$and": [
                            {"latest_disease": {"$ne": []}},
                            {"latest_disease.disease": {"$ne": "Healthy"}},
                        ]
                    }
                })

        enrich_stages = self._build_enrichment_stages()
        pipeline.extend(enrich_stages)

        count_pipeline = list(pipeline)
        count_pipeline.append({"$count": "total"})
        count_cursor = db["trees"].aggregate(count_pipeline)
        count_result = await count_cursor.to_list(length=1)
        total = count_result[0]["total"] if count_result else 0

        pipeline.append({"$skip": (page - 1) * per_page})
        pipeline.append({"$limit": per_page})
        cursor = db["trees"].aggregate(pipeline)
        items = []
        async for doc in cursor:
            doc["id"] = str(doc.pop("_id"))
            doc.pop("latest_disease", None)
            items.append(doc)
        return items, total

    async def get_by_code(self, tree_code: str) -> dict | None:
        doc = await self.collection.find_one({"tree_code": tree_code})
        if doc:
            return self._serialize(doc)
        return None

    async def count_all(self) -> int:
        return await self.collection.count_documents({})

    async def count_by_farms(self, farm_ids: list[str]) -> int:
        db = self.collection.database
        from bson import ObjectId
        farm_oids = [ObjectId(fid) for fid in farm_ids if ObjectId.is_valid(fid)]
        zone_ids = []
        async for z in db["zones"].find({"farm_id": {"$in": farm_oids}}):
            zone_ids.append(z["_id"])
        if not zone_ids:
            return 0
        return await self.collection.count_documents({"zone_id": {"$in": zone_ids}})

    async def search_by_keyword(
        self, keyword: str, page: int = 1, per_page: int = 20
    ) -> tuple[list[dict], int]:
        import re

        pattern = re.escape(keyword)
        return await self.list(
            filter_query={"tree_code": {"$regex": pattern, "$options": "i"}},
            page=page,
            per_page=per_page,
            sort=[("tree_code", 1)],
        )
