from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.dependencies import RoleChecker, get_current_user_id
from app.core.response import success_response
from app.database.mongodb import get_database
from app.models import UserRole
from app.schemas import ZoneCreate, ZoneUpdate
from app.services import ZoneService

router = APIRouter(prefix="/zones", tags=["Zones"])

allow_all = RoleChecker([r.value for r in UserRole])


@router.get("")
async def list_zones(
    farm_id: str | None = Query(None),
    keyword: str | None = Query(None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = ZoneService(db)
    items, total = await service.list_zones(farm_id, keyword, page, per_page)
    return success_response(
        data={"items": items, "total": total, "page": page, "per_page": per_page}
    )


@router.get("/{zone_id}")
async def get_zone(
    zone_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = ZoneService(db)
    zone = await service.get_zone(zone_id)
    return success_response(data=zone)


@router.post("")
async def create_zone(
    data: ZoneCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = ZoneService(db)
    zone = await service.create_zone(data)
    return success_response(data=zone, message="Zone created", status_code=201)


@router.put("/{zone_id}")
async def update_zone(
    zone_id: str,
    data: ZoneUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = ZoneService(db)
    zone = await service.update_zone(zone_id, data)
    return success_response(data=zone, message="Zone updated")


@router.delete("/{zone_id}")
async def delete_zone(
    zone_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = ZoneService(db)
    await service.delete_zone(zone_id)
    return success_response(message="Zone deleted")
