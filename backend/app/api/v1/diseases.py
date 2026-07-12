from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.dependencies import RoleChecker, get_current_user_id
from app.core.response import success_response
from app.database.mongodb import get_database
from app.models import UserRole
from app.schemas.disease import DiseaseCreate, DiseaseUpdate
from app.services.disease_service import DiseaseService

router = APIRouter(prefix="/diseases", tags=["Diseases"])

allow_all = RoleChecker([r.value for r in UserRole])


@router.get("")
async def list_diseases(
    keyword: str | None = Query(None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = DiseaseService(db)
    items, total = await service.list_diseases(page, per_page, keyword=keyword)
    return success_response(
        data={"items": items, "total": total, "page": page, "per_page": per_page}
    )


@router.get("/{id}")
async def get_disease(
    id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = DiseaseService(db)
    result = await service.get_disease(id)
    return success_response(data=result)


@router.post("")
async def create_disease(
    data: DiseaseCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = DiseaseService(db)
    result = await service.create_disease(data)
    return success_response(data=result, message="Disease created", status_code=201)


@router.put("/{id}")
async def update_disease(
    id: str,
    data: DiseaseUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = DiseaseService(db)
    result = await service.update_disease(id, data)
    return success_response(data=result, message="Disease updated")


@router.delete("/{id}")
async def delete_disease(
    id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = DiseaseService(db)
    await service.delete_disease(id)
    return success_response(message="Disease deleted")
