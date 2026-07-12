from __future__ import annotations

import logging

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.exceptions import NotFoundException
from app.repositories import FarmRepository
from app.schemas import FarmCreate, FarmUpdate

logger = logging.getLogger(__name__)


class FarmService:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.repo = FarmRepository(db)

    async def list_farms(
        self,
        user_id: str,
        page: int = 1,
        per_page: int = 20,
        keyword: str | None = None,
    ) -> tuple[list[dict], int]:
        logger.info("Listing farms for user %s (page=%d, keyword=%s)", user_id, page, keyword)
        return await self.repo.list_by_owner(user_id, page, per_page, keyword=keyword)

    async def get_farm(self, farm_id: str) -> dict:
        farm = await self.repo.get(farm_id)
        if not farm:
            raise NotFoundException("Farm not found")
        return farm

    async def create_farm(self, user_id: str, data: FarmCreate) -> dict:
        from bson import ObjectId
        company_oid = ObjectId(data.company_id) if ObjectId.is_valid(data.company_id) else ObjectId(user_id)
        
        farm_doc = {
            "farm_code": data.farm_code,
            "farm_name": data.name,
            "company_id": company_oid,
            "district": data.district,
            "area_hectare": float(data.area) if data.area is not None else 0.0,
            "tree_count": 0,
        }
        if data.address is not None:
            farm_doc["address"] = data.address
        if data.gps_lat is not None:
            farm_doc["gps_lat"] = float(data.gps_lat)
        if data.gps_lng is not None:
            farm_doc["gps_lng"] = float(data.gps_lng)

        farm_id = await self.repo.create(farm_doc)
        farm = await self.repo.get(farm_id)
        if not farm:
            raise NotFoundException("Farm not found after creation")
        logger.info("Farm created: %s by user %s", farm_id, user_id)
        return farm

    async def update_farm(self, farm_id: str, data: FarmUpdate) -> dict:
        from bson import ObjectId
        
        update_data = {}
        if data.name is not None:
            update_data["farm_name"] = data.name
        if data.area is not None:
            update_data["area_hectare"] = float(data.area)
        if data.address is not None:
            update_data["address"] = data.address
        if data.gps_lat is not None:
            update_data["gps_lat"] = float(data.gps_lat)
        if data.gps_lng is not None:
            update_data["gps_lng"] = float(data.gps_lng)
        if data.farm_code is not None:
            update_data["farm_code"] = data.farm_code
        if data.company_id is not None:
            update_data["company_id"] = ObjectId(data.company_id) if ObjectId.is_valid(data.company_id) else data.company_id
        if data.district is not None:
            update_data["district"] = data.district

        farm = await self.repo.update(farm_id, update_data)
        if not farm:
            raise NotFoundException("Farm not found")
        logger.info("Farm updated: %s", farm_id)
        return farm

    async def delete_farm(self, farm_id: str) -> None:
        deleted = await self.repo.delete(farm_id)
        if not deleted:
            raise NotFoundException("Farm not found")
        logger.info("Farm deleted: %s", farm_id)
