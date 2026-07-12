from __future__ import annotations

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.dependencies import get_current_user_id
from app.core.response import success_response
from app.database.mongodb import get_database
from app.services import HistoryService

router = APIRouter(prefix="/history", tags=["History"])


@router.get("/{tree_id}")
async def get_tree_history(
    tree_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    service = HistoryService(db)
    result = await service.get_tree_history(tree_id)
    return success_response(data=result)
