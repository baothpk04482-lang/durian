from __future__ import annotations

import re

from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.dependencies import RoleChecker, get_current_user_id
from app.core.response import success_response
from app.database.mongodb import get_database
from app.models import UserRole
from app.repositories import FarmRepository
from app.schemas import FarmCreate, FarmUpdate
from app.services import FarmService

router = APIRouter(prefix="/farms", tags=["Farms"])

allow_all = RoleChecker([r.value for r in UserRole])


@router.get("")
async def list_farms(
    keyword: str | None = Query(None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    filter_query: dict = {}
    if keyword:
        filter_query["farm_name"] = {"$regex": re.escape(keyword), "$options": "i"}
    repo = FarmRepository(db)
    items, total = await repo.list(
        filter_query=filter_query,
        page=page,
        per_page=per_page,
        sort=[("farm_code", 1)],
    )
    return success_response(
        data={"items": items, "total": total, "page": page, "per_page": per_page}
    )


@router.get("/{farm_id}")
async def get_farm(
    farm_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = FarmService(db)
    farm = await service.get_farm(farm_id)
    return success_response(data=farm)


@router.post("")
async def create_farm(
    data: FarmCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = FarmService(db)
    farm = await service.create_farm(user_id, data)
    return success_response(data=farm, message="Farm created", status_code=201)


@router.put("/{farm_id}")
async def update_farm(
    farm_id: str,
    data: FarmUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = FarmService(db)
    farm = await service.update_farm(farm_id, data)
    return success_response(data=farm, message="Farm updated")


@router.delete("/{farm_id}")
async def delete_farm(
    farm_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = FarmService(db)
    await service.delete_farm(farm_id)
    return success_response(message="Farm deleted")
