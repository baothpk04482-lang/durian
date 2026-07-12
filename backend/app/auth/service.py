from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.exceptions import (
    BadRequestException,
    ConflictException,
    UnauthorizedException,
)
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.repositories import UserRepository
from app.schemas import TokenOut, UserOut, UserProfileUpdate, UserRegister


class AuthService:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.repo = UserRepository(db)

    async def register(self, data: UserRegister) -> UserOut:
        existing = await self.repo.get_by_email(data.email)
        if existing:
            raise ConflictException("Email already registered")
            
        # Generate user_code
        count = await self.repo.collection.count_documents({})
        num = count + 1
        while True:
            user_code = f"USR{num:04d}"
            existing_user = await self.repo.collection.find_one({"user_code": user_code})
            if not existing_user:
                break
            num += 1

        password_hash = hash_password(data.password)
        user_id = await self.repo.create(
            {
                "user_code": user_code,
                "full_name": data.full_name,
                "fullname": data.full_name,
                "email": data.email,
                "password_hash": password_hash,
                "role": data.role.value,
            }
        )
        user = await self.repo.get(user_id)
        if not user:
            raise BadRequestException("Registration failed")
        return UserOut(
            id=user["id"],
            full_name=user.get("full_name") or user.get("fullname", ""),
            email=user["email"],
            role=user["role"],
            created_at=user["created_at"],
        )

    async def login(self, email: str, password: str) -> TokenOut:
        user = await self.repo.get_by_email(email)
        if not user:
            raise UnauthorizedException("Invalid email or password")
        password_hash = user.get("password_hash")
        if not password_hash:
            raise UnauthorizedException("Invalid email or password (user has no password configured)")
        if not verify_password(password, password_hash):
            raise UnauthorizedException("Invalid email or password")
        refresh_token = create_refresh_token(
            sub=user["id"], role=user["role"]
        )
        await self.repo.update_refresh_token(user["id"], refresh_token)
        return TokenOut(
            access_token=create_access_token(
                sub=user["id"], role=user["role"]
            ),
            refresh_token=refresh_token,
        )

    async def refresh(self, refresh_token: str) -> TokenOut:
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise UnauthorizedException("Invalid refresh token")
        sub = payload.get("sub")
        if sub is None:
            raise UnauthorizedException("Invalid refresh token")
        user = await self.repo.get(sub)
        if not user:
            raise UnauthorizedException("User not found")
        stored = user.get("refresh_token")
        if stored and stored != refresh_token:
            raise UnauthorizedException("Refresh token has been revoked")
        new_refresh = create_refresh_token(
            sub=user["id"], role=user["role"]
        )
        await self.repo.update_refresh_token(user["id"], new_refresh)
        return TokenOut(
            access_token=create_access_token(
                sub=user["id"], role=user["role"]
            ),
            refresh_token=new_refresh,
        )

    async def logout(self, user_id: str) -> None:
        await self.repo.update_refresh_token(user_id, "")

    async def get_me(self, user_id: str) -> UserOut:
        user = await self.repo.get(user_id)
        if not user:
            raise UnauthorizedException("User not found")
        return UserOut(
            id=user["id"],
            full_name=user.get("full_name") or user.get("fullname", ""),
            email=user["email"],
            role=user["role"],
            created_at=user["created_at"],
        )

    async def update_profile(
        self, user_id: str, data: UserProfileUpdate
    ) -> UserOut:
        update_data = {}
        if data.full_name is not None:
            update_data["full_name"] = data.full_name
            update_data["fullname"] = data.full_name
        if data.email is not None:
            update_data["email"] = data.email
            
        if "email" in update_data:
            existing = await self.repo.get_by_email(update_data["email"])
            if existing and existing["id"] != user_id:
                raise ConflictException("Email already in use")
        updated = await self.repo.update(user_id, update_data)
        if not updated:
            raise BadRequestException("Update failed")
        return UserOut(
            id=updated["id"],
            full_name=updated.get("full_name") or updated.get("fullname", ""),
            email=updated["email"],
            role=updated["role"],
            created_at=updated["created_at"],
        )

    async def change_password(
        self, user_id: str, old_password: str, new_password: str
    ) -> None:
        user = await self.repo.get(user_id)
        if not user:
            raise BadRequestException("User not found")
        password_hash = user.get("password_hash")
        if not password_hash:
            raise BadRequestException("User has no password configured. Cannot change password.")
        if not verify_password(old_password, password_hash):
            raise UnauthorizedException("Old password is incorrect")
        new_hash = hash_password(new_password)
        await self.repo.update(user_id, {"password_hash": new_hash})
