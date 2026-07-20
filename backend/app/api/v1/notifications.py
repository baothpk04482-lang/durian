from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.dependencies import RoleChecker, get_current_user_id
from app.core.response import success_response
from app.database.mongodb import get_database
from app.models import UserRole
from app.schemas import NotificationCreate, NotificationOut
from app.schemas.response_models import MessageResponse, PaginatedResponse, SuccessResponse
from app.services import NotificationService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/notifications", tags=["Notifications"])

allow_all = RoleChecker([r.value for r in UserRole])


@router.get("/unread", response_model=PaginatedResponse[NotificationOut])
async def list_unread_notifications(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = NotificationService(db)
    items, total = await service.list_unread(page, per_page)
    logger.info("Unread notifications: user=%s, total=%d", user_id, total)
    return success_response(
        data={
            "items": items,
            "total": total,
            "page": page,
            "per_page": per_page,
        }
    )


@router.get("", response_model=PaginatedResponse[NotificationOut])
async def list_notifications(
    farm_id: str | None = Query(None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = NotificationService(db)
    items, total = await service.list_notifications(farm_id, page, per_page)
    return success_response(
        data={
            "items": items,
            "total": total,
            "page": page,
            "per_page": per_page,
        }
    )


@router.get("/{notif_id}", response_model=SuccessResponse[NotificationOut])
async def get_notification(
    notif_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = NotificationService(db)
    notif = await service.get_notification(notif_id)
    return success_response(data=notif)


@router.post("", response_model=SuccessResponse[NotificationOut])
async def create_notification(
    data: NotificationCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = NotificationService(db)
    notif = await service.create_notification(data)
    return success_response(
        data=notif, message="Notification created", status_code=201
    )


@router.put("/{notif_id}/read", response_model=SuccessResponse[NotificationOut])
async def mark_notification_read(
    notif_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = NotificationService(db)
    notif = await service.mark_read(notif_id)
    return success_response(data=notif, message="Notification marked as read")


@router.delete("/{notif_id}", response_model=MessageResponse)
async def delete_notification(
    notif_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = NotificationService(db)
    await service.delete_notification(notif_id)
    return success_response(message="Notification deleted")
