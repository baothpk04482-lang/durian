from __future__ import annotations

import logging
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.exceptions import NotFoundException, BadRequestException
from app.repositories.detection_result_repository import DetectionResultRepository
from app.repositories.inspection_repository import InspectionRepository
from app.schemas.detection_result import DetectionResultCreate, DetectionResultUpdate

logger = logging.getLogger(__name__)


def serialize_detection_result(doc: dict | None) -> dict | None:
    if not doc:
        return None
    res = doc.copy()
    if "inspection_id" in res and res["inspection_id"] is not None:
        res["inspection_id"] = str(res["inspection_id"])
    return res


class DetectionResultService:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.db = db
        self.repo = DetectionResultRepository(db)
        self.inspection_repo = InspectionRepository(db)

    async def _validate_inspection(self, inspection_id: str) -> None:
        if not await self.inspection_repo.exists_by_id(inspection_id):
            raise BadRequestException(f"Inspection with ID '{inspection_id}' does not exist")

    async def list_detection_results(
        self,
        page: int = 1,
        per_page: int = 20,
        keyword: str | None = None,
    ) -> tuple[list[dict], int]:
        logger.info("Listing detection results (page=%d, keyword=%s)", page, keyword)
        docs, total = await self.repo.get_all(page, per_page, keyword)
        serialized_docs = [serialize_detection_result(doc) for doc in docs if doc is not None]
        return serialized_docs, total

    async def get_detection_result(self, id: str) -> dict:
        result = await self.repo.get_by_id(id)
        if not result:
            raise NotFoundException("Detection result not found")
        return serialize_detection_result(result)

    async def create_detection_result(self, data: DetectionResultCreate) -> dict:
        # Validate reference integrity
        await self._validate_inspection(data.inspection_id)

        det_doc = {
            "inspection_id": ObjectId(data.inspection_id),
            "model": data.model,
            "prediction": data.prediction,
            "confidence": data.confidence,
        }

        created_id = await self.repo.create(det_doc)
        result = await self.repo.get_by_id(created_id)
        if not result:
            raise BadRequestException("Detection result creation failed")

        logger.info("Detection result created: %s", created_id)
        return serialize_detection_result(result)

    async def update_detection_result(self, id: str, data: DetectionResultUpdate) -> dict:
        result = await self.repo.get_by_id(id)
        if not result:
            raise NotFoundException("Detection result not found")

        # Validate reference integrity if changed
        if data.inspection_id is not None:
            await self._validate_inspection(data.inspection_id)

        update_data = {}
        if data.inspection_id is not None:
            update_data["inspection_id"] = ObjectId(data.inspection_id)
        if data.model is not None:
            update_data["model"] = data.model
        if data.prediction is not None:
            update_data["prediction"] = data.prediction
        if data.confidence is not None:
            update_data["confidence"] = data.confidence

        if update_data:
            updated = await self.repo.update(id, update_data)
            if not updated:
                raise NotFoundException("Detection result not found during update")
            result = updated

        logger.info("Detection result updated: %s", id)
        return serialize_detection_result(result)

    async def delete_detection_result(self, id: str) -> None:
        deleted = await self.repo.delete(id)
        if not deleted:
            raise NotFoundException("Detection result not found")
        logger.info("Detection result deleted: %s", id)
