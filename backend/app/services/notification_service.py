from __future__ import annotations

import logging

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.exceptions import NotFoundException
from app.repositories import NotificationRepository
from app.repositories.zone_repository import ZoneRepository
from app.repositories.tree_repository import TreeRepository
from app.schemas import NotificationCreate

logger = logging.getLogger(__name__)


class NotificationService:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.db = db
        self.repo = NotificationRepository(db)
        self.zone_repo = ZoneRepository(db)
        self.tree_repo = TreeRepository(db)

    async def list_unread(
        self, page: int = 1, per_page: int = 20
    ) -> tuple[list[dict], int]:
        logger.info("Listing unread notifications")
        return await self.repo.list(
            filter_query={"status": "unread"},
            page=page,
            per_page=per_page,
            sort=[("created_at", -1)],
        )

    async def list_notifications(
        self,
        farm_id: str | None = None,
        page: int = 1,
        per_page: int = 20,
    ) -> tuple[list[dict], int]:
        filter_query = {}
        if farm_id:
            from bson import ObjectId
            filter_query["farm_id"] = ObjectId(farm_id) if ObjectId.is_valid(farm_id) else farm_id
        logger.info("Listing notifications (farm=%s)", farm_id)
        return await self.repo.list(
            filter_query=filter_query,
            page=page,
            per_page=per_page,
            sort=[("created_at", -1)],
        )

    async def get_notification(self, notif_id: str) -> dict:
        notif = await self.repo.get(notif_id)
        if not notif:
            raise NotFoundException("Notification not found")
        return notif

    async def create_notification(self, data: NotificationCreate) -> dict:
        from bson import ObjectId
        from datetime import datetime, timezone

        farm_oid = ObjectId(data.farm_id) if ObjectId.is_valid(data.farm_id) else ObjectId()

        # Find first zone and tree for this farm via repositories
        zone_id = await self.zone_repo.list_by_farm(str(farm_oid), page=1, per_page=1)
        zone_items = zone_id[0] if isinstance(zone_id, tuple) else []
        zone_oid = zone_items[0]["id"] if zone_items else None

        tree_oid = None
        if zone_oid:
            tree_doc = await self.tree_repo.get_first_by_zone(zone_oid)
            if tree_doc:
                tree_oid = tree_doc.get("id")

        tree_object_id = ObjectId(tree_oid) if tree_oid else ObjectId()

        alert_doc = {
            "farm_id": farm_oid,
            "tree_id": tree_object_id,
            "alert_type": data.title[:50] if data.title else "Notification",
            "priority": "Medium",
            "date": datetime.now(timezone.utc),
            "title": data.title,
            "content": data.content,
            "status": data.status.value,
        }

        notif_id = await self.repo.create(alert_doc)
        notif = await self.repo.get(notif_id)
        if not notif:
            raise NotFoundException("Notification not found after creation")
        logger.info("Notification created: %s", notif_id)
        return notif

    async def mark_read(self, notif_id: str) -> dict:
        notif = await self.repo.update(notif_id, {"status": "read"})
        if not notif:
            raise NotFoundException("Notification not found")
        logger.info("Notification marked read: %s", notif_id)
        return notif

    async def delete_notification(self, notif_id: str) -> None:
        deleted = await self.repo.delete(notif_id)
        if not deleted:
            raise NotFoundException("Notification not found")
        logger.info("Notification deleted: %s", notif_id)
