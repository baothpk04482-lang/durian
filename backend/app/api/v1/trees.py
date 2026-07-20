from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.dependencies import RoleChecker, get_current_user_id
from app.core.response import success_response
from app.database.mongodb import get_database
from app.models import UserRole
from app.schemas import TreeCreate, TreeOut, TreeUpdate
from app.schemas.response_models import (
    MessageResponse,
    PaginatedWithTotalPagesResponse,
    SuccessResponse,
)
from app.services import TreeService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/trees", tags=["Trees"])

allow_all = RoleChecker([r.value for r in UserRole])


@router.get("", response_model=PaginatedWithTotalPagesResponse[TreeOut])
async def list_trees(
    zone_id: str | None = Query(None),
    farm_id: str | None = Query(None),
    keyword: str | None = Query(None),
    status: str | None = Query(None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = TreeService(db)
    items, total = await service.list_trees(
        zone_id=zone_id,
        farm_id=farm_id,
        keyword=keyword,
        status=status,
        page=page,
        per_page=per_page,
    )
    total_pages = (total + per_page - 1) // per_page
    logger.info("List trees: user=%s, total=%d", user_id, total)
    return success_response(
        data={
            "items": items,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": total_pages,
        }
    )


@router.get("/{tree_id}", response_model=SuccessResponse[TreeOut])
async def get_tree(
    tree_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = TreeService(db)
    tree = await service.get_tree(tree_id)
    return success_response(data=tree)


@router.post("", response_model=SuccessResponse[TreeOut])
async def create_tree(
    data: TreeCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = TreeService(db)
    tree = await service.create_tree(data)
    return success_response(data=tree, message="Tree created", status_code=201)


@router.put("/{tree_id}", response_model=SuccessResponse[TreeOut])
async def update_tree(
    tree_id: str,
    data: TreeUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = TreeService(db)
    tree = await service.update_tree(tree_id, data)
    return success_response(data=tree, message="Tree updated")


@router.get("/{tree_id}/digital-id", response_model=SuccessResponse[dict])
async def get_tree_digital_id(
    tree_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = TreeService(db)
    result = await service.get_digital_id(tree_id)
    logger.info("Digital ID fetched for tree %s by user %s", tree_id, user_id)
    return success_response(data=result)


@router.delete("/{tree_id}", response_model=MessageResponse)
async def delete_tree(
    tree_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = TreeService(db)
    await service.delete_tree(tree_id)
    return success_response(message="Tree deleted")
