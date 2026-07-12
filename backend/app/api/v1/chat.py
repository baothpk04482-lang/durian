from __future__ import annotations

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.dependencies import get_current_user_id
from app.core.response import success_response
from app.database.mongodb import get_database
from app.schemas import ChatRequest
from app.services import ChatService

router = APIRouter(prefix="/chat", tags=["AI Agronomist"])


@router.post("")
async def chat(
    data: ChatRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    service = ChatService(db)
    answer = await service.ask(data.question, data.tree_id)
    return success_response(data={"answer": answer})
