from __future__ import annotations

from typing import Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.repositories.base import BaseRepository


class CompanyRepository(BaseRepository):
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        super().__init__(db, "companies")

    async def get_all(
        self, page: int = 1, per_page: int = 20, keyword: str | None = None
    ) -> tuple[list[dict[str, Any]], int]:
        import re
        filter_query: dict = {}
        if keyword:
            filter_query["company_name"] = {"$regex": re.escape(keyword), "$options": "i"}
        return await self.list(
            filter_query=filter_query,
            page=page,
            per_page=per_page,
            sort=[("company_code", 1)],
        )

    async def get_by_id(self, id: str) -> dict[str, Any] | None:
        return await self.get(id)

    async def get_company_stats(self, company_id: str) -> dict[str, int]:
        db = self.collection.database
        company_oid = ObjectId(company_id) if ObjectId.is_valid(company_id) else company_id
        
        total_farms = await db["farms"].count_documents({"company_id": company_oid})
        
        farm_ids = []
        async for f in db["farms"].find({"company_id": company_oid}, {"_id": 1}):
            farm_ids.append(f["_id"])
            
        if not farm_ids:
            return {"total_farms": 0, "total_zones": 0, "total_trees": 0}
            
        total_zones = await db["zones"].count_documents({"farm_id": {"$in": farm_ids}})
        
        zone_ids = []
        async for z in db["zones"].find({"farm_id": {"$in": farm_ids}}, {"_id": 1}):
            zone_ids.append(z["_id"])
            
        if not zone_ids:
            return {"total_farms": total_farms, "total_zones": 0, "total_trees": 0}
            
        total_trees = await db["trees"].count_documents({"zone_id": {"$in": zone_ids}})
        
        return {
            "total_farms": total_farms,
            "total_zones": total_zones,
            "total_trees": total_trees,
        }
