from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.dependencies import RoleChecker, get_current_user_id
from app.core.response import success_response
from app.database.mongodb import get_database
from app.models import UserRole
from app.schemas.disease_history import DiseaseHistoryCreate, DiseaseHistoryOut, DiseaseHistoryUpdate
from app.schemas.response_models import MessageResponse, PaginatedResponse, SuccessResponse
from app.services.disease_history_service import DiseaseHistoryService

router = APIRouter(prefix="/disease-history", tags=["Disease History"])

allow_all = RoleChecker([r.value for r in UserRole])


@router.get("", response_model=PaginatedResponse[DiseaseHistoryOut])
async def list_disease_history(
    keyword: str | None = Query(None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = DiseaseHistoryService(db)
    items, total = await service.list_disease_history(page, per_page, keyword=keyword)
    return success_response(
        data={"items": items, "total": total, "page": page, "per_page": per_page}
    )


@router.get("/{id}", response_model=SuccessResponse[DiseaseHistoryOut])
async def get_disease_history(
    id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = DiseaseHistoryService(db)
    result = await service.get_disease_history(id)
    return success_response(data=result)


@router.post("", response_model=SuccessResponse[DiseaseHistoryOut])
async def create_disease_history(
    data: DiseaseHistoryCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = DiseaseHistoryService(db)
    result = await service.create_disease_history(data)
    return success_response(data=result, message="Disease history record created", status_code=201)


@router.put("/{id}", response_model=SuccessResponse[DiseaseHistoryOut])
async def update_disease_history(
    id: str,
    data: DiseaseHistoryUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = DiseaseHistoryService(db)
    result = await service.update_disease_history(id, data)
    return success_response(data=result, message="Disease history record updated")


@router.delete("/{id}", response_model=MessageResponse)
async def delete_disease_history(
    id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = DiseaseHistoryService(db)
    await service.delete_disease_history(id)
    return success_response(message="Disease history record deleted")
