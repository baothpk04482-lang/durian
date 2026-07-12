from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings
from app.core.exceptions import BadRequestException
from app.repositories import DiseaseRepository, TreeRepository
from app.schemas import DetectionResponse, DetectionResult


class AIService:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.disease_repo = DiseaseRepository(db)
        self.tree_repo = TreeRepository(db)

    async def detect_disease(
        self, tree_id: str, file_bytes: bytes, filename: str
    ) -> DetectionResponse:
        tree = await self.tree_repo.get(tree_id)
        if not tree:
            raise BadRequestException(f"Tree with id {tree_id} not found")

        upload_dir = settings.UPLOAD_DIR
        os.makedirs(upload_dir, exist_ok=True)
        ext = os.path.splitext(filename)[1] or ".jpg"
        saved_name = f"{uuid.uuid4().hex}{ext}"
        saved_path = os.path.join(upload_dir, saved_name)
        with open(saved_path, "wb") as f:
            f.write(file_bytes)

        result = self._mock_detection()

        disease_id = await self.disease_repo.create(
            {
                "tree_id": tree_id,
                "disease_name": result.disease,
                "severity": result.severity,
                "confidence": result.confidence,
                "image_url": saved_path,
            }
        )

        disease_doc = await self.disease_repo.get(disease_id)
        created_at = disease_doc["created_at"] if disease_doc else datetime.now(timezone.utc)

        return DetectionResponse(
            tree_id=tree_id,
            image_url=saved_path,
            detection=result,
            created_at=created_at,
        )

    async def check_image_quality(self, file_bytes: bytes, filename: str) -> dict:
        return {
            "blur": False,
            "brightness": "good",
            "leaf_detected": True,
            "passed": True,
        }

    def _mock_detection(self) -> DetectionResult:
        import random

        diseases = [
            "Healthy",
            "Root Rot",
            "Leaf Spot",
            "Fruit Borer",
            "Powdery Mildew",
            "Phytophthora",
        ]
        severities = ["low", "medium", "high"]
        disease = random.choice(diseases)
        if disease == "Healthy":
            severity = "low"
            confidence = random.uniform(0.85, 0.99)
        else:
            severity = random.choice(severities)
            confidence = random.uniform(0.65, 0.98)
        return DetectionResult(
            disease=disease,
            confidence=round(confidence, 4),
            severity=severity,
        )


class OllamaService:
    async def chat(self, prompt: str) -> str:
        return self._mock_chat(prompt)

    def _mock_chat(self, prompt: str) -> str:
        return (
            "Based on the tree data and disease history, I recommend:\n"
            "1. Monitor soil moisture levels regularly\n"
            "2. Apply organic fungicide if leaf spot is detected\n"
            "3. Ensure proper drainage around the root zone\n"
            "4. Schedule follow-up inspection in 7 days\n\n"
            "The tree shows moderate risk. Early intervention is recommended."
        )
