from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.dependencies import RoleChecker, get_current_user_id
from app.core.response import success_response
from app.database.mongodb import get_database
from app.models import UserRole
from app.schemas.user_crud import UserCreate, UserUpdate
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["Users"])

allow_all = RoleChecker([r.value for r in UserRole])


@router.get("")
async def list_users(
    keyword: str | None = Query(None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = UserService(db)
    items, total = await service.list_users(page, per_page, keyword=keyword)
    return success_response(
        data={"items": items, "total": total, "page": page, "per_page": per_page}
    )


@router.get("/{id}")
async def get_user(
    id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = UserService(db)
    user = await service.get_user(id)
    return success_response(data=user)


@router.post("")
async def create_user(
    data: UserCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = UserService(db)
    user = await service.create_user(data)
    return success_response(data=user, message="User created", status_code=201)


@router.put("/{id}")
async def update_user(
    id: str,
    data: UserUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = UserService(db)
    user = await service.update_user(id, data)
    return success_response(data=user, message="User updated")


@router.delete("/{id}")
async def delete_user(
    id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = UserService(db)
    await service.delete_user(id)
    return success_response(message="User deleted")
