from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.dependencies import RoleChecker, get_current_user_id
from app.core.response import success_response
from app.database.mongodb import get_database
from app.models import UserRole
from app.schemas.detection_result import DetectionResultCreate, DetectionResultUpdate
from app.services.detection_result_service import DetectionResultService

router = APIRouter(prefix="/detection-results", tags=["Detection Results"])

allow_all = RoleChecker([r.value for r in UserRole])


@router.get("")
async def list_detection_results(
    keyword: str | None = Query(None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = DetectionResultService(db)
    items, total = await service.list_detection_results(page, per_page, keyword=keyword)
    return success_response(
        data={"items": items, "total": total, "page": page, "per_page": per_page}
    )


@router.get("/{id}")
async def get_detection_result(
    id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = DetectionResultService(db)
    result = await service.get_detection_result(id)
    return success_response(data=result)


@router.post("")
async def create_detection_result(
    data: DetectionResultCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = DetectionResultService(db)
    result = await service.create_detection_result(data)
    return success_response(data=result, message="Detection result created", status_code=201)


@router.put("/{id}")
async def update_detection_result(
    id: str,
    data: DetectionResultUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = DetectionResultService(db)
    result = await service.update_detection_result(id, data)
    return success_response(data=result, message="Detection result updated")


@router.delete("/{id}")
async def delete_detection_result(
    id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = DetectionResultService(db)
    await service.delete_detection_result(id)
    return success_response(message="Detection result deleted")
