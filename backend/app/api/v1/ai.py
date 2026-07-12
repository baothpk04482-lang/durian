from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, File, Form, UploadFile
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.ai.service import AIService
from app.core.dependencies import RoleChecker, get_current_user_id
from app.core.exceptions import BadRequestException
from app.core.response import success_response
from app.database.mongodb import get_database
from app.models import UserRole

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["AI Detection"])

allow_all = RoleChecker([r.value for r in UserRole])


@router.post("/detect")
async def detect_disease(
    tree_id: str = Form(...),
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    if not file.filename:
        raise BadRequestException("No file provided")
    contents = await file.read()
    service = AIService(db)
    result = await service.detect_disease(tree_id, contents, file.filename)
    logger.info("Detection completed for tree %s by user %s", tree_id, user_id)
    return success_response(
        data=result.model_dump(),
        message="Detection completed",
    )


@router.post("/image-quality")
async def check_image_quality(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    if not file.filename:
        raise BadRequestException("No file provided")
    contents = await file.read()
    service = AIService(db)
    result = await service.check_image_quality(contents, file.filename)
    logger.info("Image quality check by user %s: %s", user_id, result)
    return success_response(
        data=result,
        message="Image quality checked",
    )
