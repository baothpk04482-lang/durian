from __future__ import annotations

import logging

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.exceptions import NotFoundException
from app.repositories import ZoneRepository
from app.schemas import ZoneCreate, ZoneUpdate

logger = logging.getLogger(__name__)


class ZoneService:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.repo = ZoneRepository(db)

    async def list_zones(
        self,
        farm_id: str | None = None,
        keyword: str | None = None,
        page: int = 1,
        per_page: int = 20,
    ) -> tuple[list[dict], int]:
        if farm_id:
            logger.info("Listing zones for farm %s", farm_id)
            return await self.repo.list_by_farm(farm_id, page, per_page, keyword=keyword)
        import re

        filter_query = None
        if keyword:
            filter_query = {"zone_name": {"$regex": re.escape(keyword), "$options": "i"}}
        logger.info("Listing all zones (keyword=%s)", keyword)
        return await self.repo.list(
            filter_query=filter_query,
            page=page,
            per_page=per_page,
            sort=[("zone_code", 1)],
        )

    async def get_zone(self, zone_id: str) -> dict:
        zone = await self.repo.get(zone_id)
        if not zone:
            raise NotFoundException("Zone not found")
        return zone

    async def create_zone(self, data: ZoneCreate) -> dict:
        from bson import ObjectId
        farm_oid = ObjectId(data.farm_id) if ObjectId.is_valid(data.farm_id) else ObjectId()
        zone_id = await self.repo.create(
            {
                "farm_id": farm_oid,
                "zone_name": data.name,
                "tree_count": int(data.tree_count),
            }
        )
        zone = await self.repo.get(zone_id)
        if not zone:
            raise NotFoundException("Zone not found after creation")
        logger.info("Zone created: %s", zone_id)
        return zone

    async def update_zone(self, zone_id: str, data: ZoneUpdate) -> dict:
        update_data = {}
        if data.name is not None:
            update_data["zone_name"] = data.name
        if data.tree_count is not None:
            update_data["tree_count"] = int(data.tree_count)

        zone = await self.repo.update(zone_id, update_data)
        if not zone:
            raise NotFoundException("Zone not found")
        logger.info("Zone updated: %s", zone_id)
        return zone

    async def delete_zone(self, zone_id: str) -> None:
        deleted = await self.repo.delete(zone_id)
        if not deleted:
            raise NotFoundException("Zone not found")
        logger.info("Zone deleted: %s", zone_id)
