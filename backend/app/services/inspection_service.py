from __future__ import annotations

import logging
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.exceptions import NotFoundException, BadRequestException
from app.repositories.inspection_repository import InspectionRepository
from app.schemas.inspection import InspectionCreate, InspectionUpdate

logger = logging.getLogger(__name__)


def serialize_inspection(doc: dict | None) -> dict | None:
    if not doc:
        return None
    res = doc.copy()
    for field in ["farm_id", "zone_id", "tree_id", "disease_id", "inspector_id"]:
        if field in res and res[field] is not None:
            res[field] = str(res[field])
    return res


class InspectionService:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.db = db
        self.repo = InspectionRepository(db)

    async def _validate_inspector(self, inspector_id: str) -> None:
        if not ObjectId.is_valid(inspector_id):
            raise BadRequestException("Invalid inspector_id format")
        user = await self.db["users"].find_one({"_id": ObjectId(inspector_id)})
        if not user:
            raise BadRequestException(f"Inspector with ID '{inspector_id}' does not exist")

    async def _validate_tree(self, tree_id: str) -> None:
        if not ObjectId.is_valid(tree_id):
            raise BadRequestException("Invalid tree_id format")
        tree = await self.db["trees"].find_one({"_id": ObjectId(tree_id)})
        if not tree:
            raise BadRequestException(f"Tree with ID '{tree_id}' does not exist")

    async def list_inspections(
        self,
        page: int = 1,
        per_page: int = 20,
        keyword: str | None = None,
    ) -> tuple[list[dict], int]:
        logger.info("Listing inspections (page=%d, keyword=%s)", page, keyword)
        docs, total = await self.repo.get_all(page, per_page, keyword)
        serialized_docs = [serialize_inspection(doc) for doc in docs if doc is not None]
        return serialized_docs, total

    async def get_inspection(self, id: str) -> dict:
        inspection = await self.repo.get_by_id(id)
        if not inspection:
            raise NotFoundException("Inspection not found")
        return serialize_inspection(inspection)

    async def create_inspection(self, data: InspectionCreate, inspector_id: str) -> dict:
        # Validate relationship integrity
        await self._validate_tree(data.tree_id)
        await self._validate_inspector(inspector_id)

        # Validate inputs formats
        if not ObjectId.is_valid(data.farm_id):
            raise BadRequestException("Invalid farm_id format")
        if not ObjectId.is_valid(data.zone_id):
            raise BadRequestException("Invalid zone_id format")
        if data.disease_id and not ObjectId.is_valid(data.disease_id):
            raise BadRequestException("Invalid disease_id format")

        insp_doc = {
            "inspection_code": data.inspection_code,
            "farm_id": ObjectId(data.farm_id),
            "zone_id": ObjectId(data.zone_id),
            "tree_id": ObjectId(data.tree_id),
            "disease_id": ObjectId(data.disease_id) if data.disease_id else None,
            "inspector_id": ObjectId(inspector_id),
            "inspection_date": data.inspection_date,
            "temperature": data.temperature,
            "humidity": data.humidity,
            "rainfall": data.rainfall,
            "confidence": data.confidence,
            "predicted_disease": data.predicted_disease,
            "health_status": data.health_status,
        }

        created_id = await self.repo.create(insp_doc)
        inspection = await self.repo.get_by_id(created_id)
        if not inspection:
            raise BadRequestException("Inspection creation failed")

        logger.info("Inspection created: %s (%s)", created_id, data.inspection_code)
        return serialize_inspection(inspection)

    async def update_inspection(self, id: str, data: InspectionUpdate, inspector_id: str) -> dict:
        inspection = await self.repo.get_by_id(id)
        if not inspection:
            raise NotFoundException("Inspection not found")

        # Validate relationship integrity if changed
        if data.tree_id is not None:
            await self._validate_tree(data.tree_id)
        await self._validate_inspector(inspector_id)

        update_data = {}
        if data.farm_id is not None:
            if not ObjectId.is_valid(data.farm_id):
                raise BadRequestException("Invalid farm_id format")
            update_data["farm_id"] = ObjectId(data.farm_id)

        if data.zone_id is not None:
            if not ObjectId.is_valid(data.zone_id):
                raise BadRequestException("Invalid zone_id format")
            update_data["zone_id"] = ObjectId(data.zone_id)

        if data.tree_id is not None:
            update_data["tree_id"] = ObjectId(data.tree_id)

        if data.disease_id is not None:
            if data.disease_id:
                if not ObjectId.is_valid(data.disease_id):
                    raise BadRequestException("Invalid disease_id format")
                update_data["disease_id"] = ObjectId(data.disease_id)
            else:
                update_data["disease_id"] = None

        if data.inspection_date is not None:
            update_data["inspection_date"] = data.inspection_date
        if data.temperature is not None:
            update_data["temperature"] = data.temperature
        if data.humidity is not None:
            update_data["humidity"] = data.humidity
        if data.rainfall is not None:
            update_data["rainfall"] = data.rainfall
        if data.confidence is not None:
            update_data["confidence"] = data.confidence
        if data.predicted_disease is not None:
            update_data["predicted_disease"] = data.predicted_disease
        if data.health_status is not None:
            update_data["health_status"] = data.health_status

        if update_data:
            updated = await self.repo.update(id, update_data)
            if not updated:
                raise NotFoundException("Inspection not found during update")
            inspection = updated

        logger.info("Inspection updated: %s", id)
        return serialize_inspection(inspection)

    async def delete_inspection(self, id: str) -> None:
        deleted = await self.repo.delete(id)
        if not deleted:
            raise NotFoundException("Inspection not found")
        logger.info("Inspection deleted: %s", id)
