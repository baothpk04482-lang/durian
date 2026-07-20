from __future__ import annotations

import logging

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.exceptions import NotFoundException
from app.repositories import (
    DiseaseRepository,
    TreeRepository,
)
from app.repositories.zone_repository import ZoneRepository
from app.schemas import TreeCreate, TreeUpdate

logger = logging.getLogger(__name__)


class TreeService:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.db = db
        self.repo = TreeRepository(db)
        self.disease_repo = DiseaseRepository(db)
        self.zone_repo = ZoneRepository(db)

    async def list_trees(
        self,
        zone_id: str | None = None,
        farm_id: str | None = None,
        keyword: str | None = None,
        status: str | None = None,
        page: int = 1,
        per_page: int = 20,
    ) -> tuple[list[dict], int]:
        logger.info("Listing trees (zone=%s, farm=%s, keyword=%s)", zone_id, farm_id, keyword)
        return await self.repo.list_filtered(
            zone_id=zone_id,
            farm_id=farm_id,
            keyword=keyword,
            status=status,
            page=page,
            per_page=per_page,
        )

    async def get_tree(self, tree_id: str) -> dict:
        tree = await self.repo.get(tree_id)
        if not tree:
            raise NotFoundException("Tree not found")
        return tree

    async def create_tree(self, data: TreeCreate) -> dict:
        from bson import ObjectId
        from datetime import datetime, time

        zone_oid = ObjectId(data.zone_id) if ObjectId.is_valid(data.zone_id) else ObjectId()

        # Get farm_id from zone via repository
        farm_id_str = await self.zone_repo.get_farm_id(data.zone_id)
        if not farm_id_str:
            raise NotFoundException("Zone not found")
        farm_oid = ObjectId(farm_id_str)

        planting_dt = None
        if data.planting_date:
            planting_dt = datetime.combine(data.planting_date, time.min)

        tree_doc = {
            "tree_code": data.tree_code,
            "farm_id": farm_oid,
            "zone_id": zone_oid,
            "variety": data.variety if data.variety is not None else "Ri6",
            "planting_date": planting_dt if planting_dt else datetime.now(),
            "tree_age": int(data.age) if data.age is not None else 0,
            "status": data.status,
        }
        if data.gps_lat is not None:
            tree_doc["gps_lat"] = float(data.gps_lat)
        if data.gps_lng is not None:
            tree_doc["gps_lng"] = float(data.gps_lng)

        tree_id = await self.repo.create(tree_doc)
        tree = await self.repo.get(tree_id)
        if not tree:
            raise NotFoundException("Tree not found after creation")
        logger.info("Tree created: %s", tree_id)
        return tree

    async def update_tree(self, tree_id: str, data: TreeUpdate) -> dict:
        from bson import ObjectId
        from datetime import datetime, time

        update_data = {}
        if data.tree_code is not None:
            update_data["tree_code"] = data.tree_code
        if data.variety is not None:
            update_data["variety"] = data.variety
        if data.age is not None:
            update_data["tree_age"] = int(data.age)
        if data.status is not None:
            update_data["status"] = data.status
        if data.gps_lat is not None:
            update_data["gps_lat"] = float(data.gps_lat)
        if data.gps_lng is not None:
            update_data["gps_lng"] = float(data.gps_lng)

        if data.planting_date is not None:
            update_data["planting_date"] = datetime.combine(data.planting_date, time.min) if data.planting_date else None

        if hasattr(data, 'zone_id') and data.zone_id is not None:
            farm_id_str = await self.zone_repo.get_farm_id(data.zone_id)
            if not farm_id_str:
                raise NotFoundException("Zone not found")
            update_data["zone_id"] = ObjectId(data.zone_id)
            update_data["farm_id"] = ObjectId(farm_id_str)

        tree = await self.repo.update(tree_id, update_data)
        if not tree:
            raise NotFoundException("Tree not found")
        logger.info("Tree updated: %s", tree_id)
        return tree

    async def delete_tree(self, tree_id: str) -> None:
        deleted = await self.repo.delete(tree_id)
        if not deleted:
            raise NotFoundException("Tree not found")
        logger.info("Tree deleted: %s", tree_id)

    async def get_digital_id(self, tree_id: str) -> dict:
        tree = await self.repo.get(tree_id)
        if not tree:
            raise NotFoundException("Tree not found")

        diseases, _ = await self.disease_repo.list_by_tree(tree_id, page=1, per_page=50)
        images = [d.get("image_url") for d in diseases if d.get("image_url")]

        logger.info("Digital ID fetched for tree %s", tree_id)
        return {
            "tree": tree,
            "disease_history": diseases,
            "latest_risk": None,
            "weather": None,
            "images": images,
            "recommendation": None,
        }
