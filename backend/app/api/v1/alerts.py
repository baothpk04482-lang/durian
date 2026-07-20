from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.dependencies import RoleChecker, get_current_user_id
from app.core.response import success_response
from app.database.mongodb import get_database
from app.models import UserRole
from app.schemas.alert import AlertCreate, AlertOut, AlertUpdate
from app.schemas.response_models import MessageResponse, PaginatedResponse, SuccessResponse
from app.services.alert_service import AlertService

router = APIRouter(prefix="/alerts", tags=["Alerts"])

allow_all = RoleChecker([r.value for r in UserRole])


@router.get("", response_model=PaginatedResponse[AlertOut])
async def list_alerts(
    keyword: str | None = Query(None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = AlertService(db)
    items, total = await service.list_alerts(page, per_page, keyword=keyword)
    return success_response(
        data={"items": items, "total": total, "page": page, "per_page": per_page}
    )


@router.get("/{id}", response_model=SuccessResponse[AlertOut])
async def get_alert(
    id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = AlertService(db)
    result = await service.get_alert(id)
    return success_response(data=result)


@router.post("", response_model=SuccessResponse[AlertOut])
async def create_alert(
    data: AlertCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = AlertService(db)
    result = await service.create_alert(data)
    return success_response(data=result, message="Alert created", status_code=201)


@router.put("/{id}", response_model=SuccessResponse[AlertOut])
async def update_alert(
    id: str,
    data: AlertUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = AlertService(db)
    result = await service.update_alert(id, data)
    return success_response(data=result, message="Alert updated")


@router.delete("/{id}", response_model=MessageResponse)
async def delete_alert(
    id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = AlertService(db)
    await service.delete_alert(id)
    return success_response(message="Alert deleted")
