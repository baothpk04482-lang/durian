from __future__ import annotations

import logging
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.exceptions import NotFoundException, BadRequestException
from app.repositories.diseases_repository import DiseasesRepository
from app.schemas.disease import DiseaseCreate, DiseaseUpdate

logger = logging.getLogger(__name__)


def serialize_disease(doc: dict | None) -> dict | None:
    if not doc:
        return None
    return doc.copy()


class DiseaseService:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.db = db
        self.repo = DiseasesRepository(db)

    async def list_diseases(
        self,
        page: int = 1,
        per_page: int = 20,
        keyword: str | None = None,
    ) -> tuple[list[dict], int]:
        logger.info("Listing diseases (page=%d, keyword=%s)", page, keyword)
        docs, total = await self.repo.get_all(page, per_page, keyword)
        serialized_docs = [serialize_disease(doc) for doc in docs if doc is not None]
        return serialized_docs, total

    async def get_disease(self, id: str) -> dict:
        result = await self.repo.get_by_id(id)
        if not result:
            raise NotFoundException("Disease not found")
        return serialize_disease(result)

    async def create_disease(self, data: DiseaseCreate) -> dict:
        if await self.repo.exists_by_code(data.code):
            raise BadRequestException(f"Disease code '{data.code}' already exists")

        disease_doc = {
            "code": data.code,
            "name": data.name,
            "affected_part": data.affected_part,
            "severity": data.severity,
            "description": data.description,
            "recommendation": data.recommendation,
        }

        created_id = await self.repo.create(disease_doc)
        result = await self.repo.get_by_id(created_id)
        if not result:
            raise BadRequestException("Disease creation failed")

        logger.info("Disease created: %s", created_id)
        return serialize_disease(result)

    async def update_disease(self, id: str, data: DiseaseUpdate) -> dict:
        result = await self.repo.get_by_id(id)
        if not result:
            raise NotFoundException("Disease not found")

        # Check uniqueness of code if changing
        if data.code is not None and data.code != result.get("code"):
            if await self.repo.exists_by_code(data.code, exclude_id=id):
                raise BadRequestException(f"Disease code '{data.code}' already exists")

        update_data = {}
        if data.code is not None:
            update_data["code"] = data.code
        if data.name is not None:
            update_data["name"] = data.name
        if data.affected_part is not None:
            update_data["affected_part"] = data.affected_part
        if data.severity is not None:
            update_data["severity"] = data.severity
        if data.description is not None:
            update_data["description"] = data.description
        if data.recommendation is not None:
            update_data["recommendation"] = data.recommendation

        if update_data:
            updated = await self.repo.update(id, update_data)
            if not updated:
                raise NotFoundException("Disease not found during update")
            result = updated

        logger.info("Disease updated: %s", id)
        return serialize_disease(result)

    async def delete_disease(self, id: str) -> None:
        deleted = await self.repo.delete(id)
        if not deleted:
            raise NotFoundException("Disease not found")
        logger.info("Disease deleted: %s", id)
