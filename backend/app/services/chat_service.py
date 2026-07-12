from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.ai.service import OllamaService
from app.repositories import (
    DiseaseRepository,
    TreeRepository,
)
from app.repositories.zone_repository import ZoneRepository


class ChatService:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.db = db
        self.tree_repo = TreeRepository(db)
        self.disease_repo = DiseaseRepository(db)
        self.zone_repo = ZoneRepository(db)
        self.ollama = OllamaService()

    async def ask(self, question: str, tree_id: str) -> str:
        tree = await self.tree_repo.get(tree_id)
        tree_info = f"Tree #{tree_id}"
        if tree:
            tree_info = (
                f"Tree Code: {tree.get('tree_code', 'N/A')}, "
                f"Variety: {tree.get('variety', 'N/A')}, "
                f"Age: {tree.get('tree_age', 'N/A')} years"
            )

        diseases, _ = await self.disease_repo.list_by_tree(
            tree_id, page=1, per_page=5
        )
        disease_info = "No disease history"
        if diseases:
            disease_info = "; ".join(
                f"{d.get('disease', 'N/A')} (severity: {d.get('severity', 'N/A')}, "
                f"confidence: {d.get('confidence', 'N/A')})"
                for d in diseases
            )

        weather_info = "No weather data"

        prompt = (
            f"You are an AI Agronomist specializing in durian farming. "
            f"Answer the following question based on the data provided.\n\n"
            f"Farmer Question: {question}\n\n"
            f"Tree Information:\n{tree_info}\n\n"
            f"Disease History:\n{disease_info}\n\n"
            f"Weather Data (last 3 days):\n{weather_info}\n\n"
            f"Provide practical, actionable advice for the farmer."
        )

        return await self.ollama.chat(prompt)
