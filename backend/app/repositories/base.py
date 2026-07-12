from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorCollection, AsyncIOMotorDatabase


class BaseRepository:
    def __init__(self, db: AsyncIOMotorDatabase, collection_name: str) -> None:
        self.collection: AsyncIOMotorCollection = db[collection_name]

    async def create(self, data: dict[str, Any]) -> str:
        now = datetime.now(timezone.utc)
        data["created_at"] = now
        data["updated_at"] = now
        result = await self.collection.insert_one(data)
        return str(result.inserted_id)

    async def get(self, id: str) -> dict[str, Any] | None:
        if not ObjectId.is_valid(id):
            return None
        doc = await self.collection.find_one({"_id": ObjectId(id)})
        if doc:
            return self._serialize(doc)
        return None

    async def list(
        self,
        filter_query: dict[str, Any] | None = None,
        page: int = 1,
        per_page: int = 20,
        sort: list[tuple[str, int]] | None = None,
    ) -> tuple[list[dict[str, Any]], int]:
        filter_query = filter_query or {}
        total = await self.collection.count_documents(filter_query)

        cursor = self.collection.find(filter_query)
        if sort:
            cursor = cursor.sort(sort)
        cursor = cursor.skip((page - 1) * per_page).limit(per_page)

        docs = []
        async for doc in cursor:
            docs.append(self._serialize(doc))
        return docs, total

    async def update(
        self, id: str, data: dict[str, Any]
    ) -> dict[str, Any] | None:
        if not ObjectId.is_valid(id):
            return None
        data["updated_at"] = datetime.now(timezone.utc)
        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(id)},
            {"$set": data},
            return_document=True,
        )
        if result:
            return self._serialize(result)
        return None

    async def delete(self, id: str) -> bool:
        if not ObjectId.is_valid(id):
            return False
        result = await self.collection.delete_one({"_id": ObjectId(id)})
        return result.deleted_count > 0

    def _serialize(self, doc: dict[str, Any]) -> dict[str, Any]:
        doc["id"] = str(doc.pop("_id"))
        return doc

    def _deserialize(self, data: dict[str, Any]) -> dict[str, Any]:
        if "id" in data:
            data["_id"] = ObjectId(data.pop("id"))
        return data
