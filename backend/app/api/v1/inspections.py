from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.dependencies import RoleChecker, get_current_user_id
from app.core.response import success_response
from app.database.mongodb import get_database
from app.models import UserRole
from app.schemas.inspection import InspectionCreate, InspectionUpdate
from app.services.inspection_service import InspectionService

router = APIRouter(prefix="/inspections", tags=["Inspections"])

allow_all = RoleChecker([r.value for r in UserRole])


@router.get("")
async def list_inspections(
    keyword: str | None = Query(None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = InspectionService(db)
    items, total = await service.list_inspections(page, per_page, keyword=keyword)
    return success_response(
        data={"items": items, "total": total, "page": page, "per_page": per_page}
    )


@router.get("/{id}")
async def get_inspection(
    id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = InspectionService(db)
    inspection = await service.get_inspection(id)
    return success_response(data=inspection)


@router.post("")
async def create_inspection(
    data: InspectionCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = InspectionService(db)
    # The authenticated user_id acts as the inspector_id
    inspection = await service.create_inspection(data, user_id)
    return success_response(data=inspection, message="Inspection created", status_code=201)


@router.put("/{id}")
async def update_inspection(
    id: str,
    data: InspectionUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = InspectionService(db)
    # The authenticated user_id acts as the inspector_id
    inspection = await service.update_inspection(id, data, user_id)
    return success_response(data=inspection, message="Inspection updated")


@router.delete("/{id}")
async def delete_inspection(
    id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = InspectionService(db)
    await service.delete_inspection(id)
    return success_response(message="Inspection deleted")
