from __future__ import annotations

import logging
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.exceptions import NotFoundException, BadRequestException
from app.repositories.disease_history_repository import DiseaseHistoryRepository
from app.schemas.disease_history import DiseaseHistoryCreate, DiseaseHistoryUpdate

logger = logging.getLogger(__name__)


def serialize_disease_history(doc: dict | None) -> dict | None:
    if not doc:
        return None
    res = doc.copy()
    if "tree_id" in res and res["tree_id"] is not None:
        res["tree_id"] = str(res["tree_id"])
    return res


class DiseaseHistoryService:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.db = db
        self.repo = DiseaseHistoryRepository(db)

    async def _validate_tree(self, tree_id: str) -> None:
        if not ObjectId.is_valid(tree_id):
            raise BadRequestException("Invalid tree_id format")
        tree = await self.db["trees"].find_one({"_id": ObjectId(tree_id)})
        if not tree:
            raise BadRequestException(f"Tree with ID '{tree_id}' does not exist")

    async def list_disease_history(
        self,
        page: int = 1,
        per_page: int = 20,
        keyword: str | None = None,
    ) -> tuple[list[dict], int]:
        logger.info("Listing disease history (page=%d, keyword=%s)", page, keyword)
        docs, total = await self.repo.get_all(page, per_page, keyword)
        serialized_docs = [serialize_disease_history(doc) for doc in docs if doc is not None]
        return serialized_docs, total

    async def get_disease_history(self, id: str) -> dict:
        result = await self.repo.get_by_id(id)
        if not result:
            raise NotFoundException("Disease history record not found")
        return serialize_disease_history(result)

    async def create_disease_history(self, data: DiseaseHistoryCreate) -> dict:
        # Validate reference integrity
        await self._validate_tree(data.tree_id)

        hist_doc = {
            "tree_id": ObjectId(data.tree_id),
            "disease": data.disease,
            "date": data.date,
            "action": data.action,
        }

        created_id = await self.repo.create(hist_doc)
        result = await self.repo.get_by_id(created_id)
        if not result:
            raise BadRequestException("Disease history record creation failed")

        logger.info("Disease history record created: %s", created_id)
        return serialize_disease_history(result)

    async def update_disease_history(self, id: str, data: DiseaseHistoryUpdate) -> dict:
        result = await self.repo.get_by_id(id)
        if not result:
            raise NotFoundException("Disease history record not found")

        # Validate reference integrity if changed
        if data.tree_id is not None:
            await self._validate_tree(data.tree_id)

        update_data = {}
        if data.tree_id is not None:
            update_data["tree_id"] = ObjectId(data.tree_id)
        if data.disease is not None:
            update_data["disease"] = data.disease
        if data.date is not None:
            update_data["date"] = data.date
        if data.action is not None:
            update_data["action"] = data.action

        if update_data:
            updated = await self.repo.update(id, update_data)
            if not updated:
                raise NotFoundException("Disease history record not found during update")
            result = updated

        logger.info("Disease history record updated: %s", id)
        return serialize_disease_history(result)

    async def delete_disease_history(self, id: str) -> None:
        deleted = await self.repo.delete(id)
        if not deleted:
            raise NotFoundException("Disease history record not found")
        logger.info("Disease history record deleted: %s", id)
