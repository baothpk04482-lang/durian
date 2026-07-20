from __future__ import annotations

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.auth.service import AuthService
from app.core.dependencies import get_current_user_id
from app.core.response import success_response
from app.database.mongodb import get_database
from app.schemas import (
    ChangePassword,
    TokenOut,
    TokenRefresh,
    UserLogin,
    UserProfileUpdate,
    UserOut,
    UserRegister,
)
from app.schemas.response_models import MessageResponse, SuccessResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=SuccessResponse[UserOut])
async def register(
    data: UserRegister,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    service = AuthService(db)
    result = await service.register(data)
    return success_response(
        data=result.model_dump(),
        message="Registration successful",
        status_code=201,
    )


@router.post("/login", response_model=SuccessResponse[TokenOut])
async def login(
    data: UserLogin,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    service = AuthService(db)
    result = await service.login(data.email, data.password)
    return success_response(
        data=result.model_dump(),
        message="Login successful",
    )


@router.post("/refresh", response_model=SuccessResponse[TokenOut])
async def refresh(
    data: TokenRefresh,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    service = AuthService(db)
    result = await service.refresh(data.refresh_token)
    return success_response(
        data=result.model_dump(),
        message="Token refreshed",
    )


@router.get("/me", response_model=SuccessResponse[UserOut])
async def get_me(
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    service = AuthService(db)
    result = await service.get_me(user_id)
    return success_response(data=result.model_dump())


@router.put("/profile", response_model=SuccessResponse[UserOut])
async def update_profile(
    data: UserProfileUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    service = AuthService(db)
    result = await service.update_profile(user_id, data)
    return success_response(
        data=result.model_dump(),
        message="Profile updated",
    )


@router.post("/logout", response_model=MessageResponse)
async def logout(
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    service = AuthService(db)
    await service.logout(user_id)
    return success_response(message="Logged out successfully")


@router.put("/change-password", response_model=MessageResponse)
async def change_password(
    data: ChangePassword,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    service = AuthService(db)
    await service.change_password(user_id, data.old_password, data.new_password)
    return success_response(message="Password changed successfully")
