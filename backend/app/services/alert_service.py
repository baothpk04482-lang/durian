from __future__ import annotations

import logging
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.exceptions import NotFoundException, BadRequestException
from app.repositories.alert_repository import AlertRepository
from app.repositories.farm_repository import FarmRepository
from app.repositories.tree_repository import TreeRepository
from app.schemas.alert import AlertCreate, AlertUpdate

logger = logging.getLogger(__name__)


def serialize_alert(doc: dict | None) -> dict | None:
    if not doc:
        return None
    res = doc.copy()
    if "farm_id" in res and res["farm_id"] is not None:
        res["farm_id"] = str(res["farm_id"])
    if "tree_id" in res and res["tree_id"] is not None:
        res["tree_id"] = str(res["tree_id"])
    return res


class AlertService:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.db = db
        self.repo = AlertRepository(db)
        self.farm_repo = FarmRepository(db)
        self.tree_repo = TreeRepository(db)

    async def _validate_farm(self, farm_id: str) -> None:
        if not await self.farm_repo.exists_by_id(farm_id):
            raise BadRequestException(f"Farm with ID '{farm_id}' does not exist")

    async def _validate_tree(self, tree_id: str) -> None:
        if not await self.tree_repo.exists_by_id(tree_id):
            raise BadRequestException(f"Tree with ID '{tree_id}' does not exist")

    async def list_alerts(
        self,
        page: int = 1,
        per_page: int = 20,
        keyword: str | None = None,
    ) -> tuple[list[dict], int]:
        logger.info("Listing alerts (page=%d, keyword=%s)", page, keyword)
        docs, total = await self.repo.get_all(page, per_page, keyword)
        serialized_docs = [serialize_alert(doc) for doc in docs if doc is not None]
        return serialized_docs, total

    async def get_alert(self, id: str) -> dict:
        result = await self.repo.get_by_id(id)
        if not result:
            raise NotFoundException("Alert not found")
        return serialize_alert(result)

    async def create_alert(self, data: AlertCreate) -> dict:
        # Validate reference integrity
        await self._validate_farm(data.farm_id)
        await self._validate_tree(data.tree_id)

        alert_doc = {
            "farm_id": ObjectId(data.farm_id),
            "tree_id": ObjectId(data.tree_id),
            "alert_type": data.alert_type,
            "priority": data.priority,
            "date": data.date,
        }

        created_id = await self.repo.create(alert_doc)
        result = await self.repo.get_by_id(created_id)
        if not result:
            raise BadRequestException("Alert creation failed")

        logger.info("Alert created: %s", created_id)
        return serialize_alert(result)

    async def update_alert(self, id: str, data: AlertUpdate) -> dict:
        result = await self.repo.get_by_id(id)
        if not result:
            raise NotFoundException("Alert not found")

        # Validate reference integrity if changed
        if data.farm_id is not None:
            await self._validate_farm(data.farm_id)
        if data.tree_id is not None:
            await self._validate_tree(data.tree_id)

        update_data = {}
        if data.farm_id is not None:
            update_data["farm_id"] = ObjectId(data.farm_id)
        if data.tree_id is not None:
            update_data["tree_id"] = ObjectId(data.tree_id)
        if data.alert_type is not None:
            update_data["alert_type"] = data.alert_type
        if data.priority is not None:
            update_data["priority"] = data.priority
        if data.date is not None:
            update_data["date"] = data.date

        if update_data:
            updated = await self.repo.update(id, update_data)
            if not updated:
                raise NotFoundException("Alert not found during update")
            result = updated

        logger.info("Alert updated: %s", id)
        return serialize_alert(result)

    async def delete_alert(self, id: str) -> None:
        deleted = await self.repo.delete(id)
        if not deleted:
            raise NotFoundException("Alert not found")
        logger.info("Alert deleted: %s", id)
