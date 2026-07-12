from __future__ import annotations

import logging

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.repositories import DiseaseRepository

logger = logging.getLogger(__name__)


class HistoryService:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.disease_repo = DiseaseRepository(db)

    async def get_tree_history(self, tree_id: str) -> dict:
        logger.info("Fetching history for tree %s", tree_id)
        diseases, _ = await self.disease_repo.list_by_tree(tree_id, page=1, per_page=50)
        return {
            "tree_id": tree_id,
            "disease_history": diseases,
            "risk_assessments": [],
        }
