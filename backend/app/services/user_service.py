from __future__ import annotations

import logging
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.exceptions import NotFoundException, ConflictException, BadRequestException
from app.core.security import hash_password
from app.models.enums import UserRole
from app.repositories.user_repository import UserRepository
from app.schemas.user_crud import UserCreate, UserUpdate

logger = logging.getLogger(__name__)

# Bidirectional role mappings to support both API enums and DB JSON Schema validation rules
API_TO_DB_ROLE = {
    UserRole.enterprise_admin.value: "Admin",
    UserRole.farm_manager.value: "Farm Manager",
    UserRole.field_technician.value: "Inspector",
    UserRole.farmer.value: "Technician",
}

DB_TO_API_ROLE = {
    "Admin": UserRole.enterprise_admin.value,
    "Company Manager": UserRole.farm_manager.value,
    "Farm Manager": UserRole.farm_manager.value,
    "Inspector": UserRole.field_technician.value,
    "Technician": UserRole.farmer.value,
}


def serialize_user(doc: dict | None) -> dict | None:
    if not doc:
        return None
    res = doc.copy()
    db_role = res.get("role")
    res["role"] = DB_TO_API_ROLE.get(db_role, UserRole.field_technician.value)
    # never expose password hash
    res.pop("password_hash", None)
    return res


class UserService:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.repo = UserRepository(db)

    async def list_users(
        self,
        page: int = 1,
        per_page: int = 20,
        keyword: str | None = None,
    ) -> tuple[list[dict], int]:
        logger.info("Listing users (page=%d, keyword=%s)", page, keyword)
        docs, total = await self.repo.get_all(page, per_page, keyword)
        serialized_docs = [serialize_user(doc) for doc in docs if doc is not None]
        return serialized_docs, total

    async def get_user(self, user_id: str) -> dict:
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")
        return serialize_user(user)

    async def create_user(self, data: UserCreate) -> dict:
        existing = await self.repo.get_by_email(data.email)
        if existing:
            raise ConflictException("Email already in use")

        # Generate unique user_code
        count = await self.repo.collection.count_documents({})
        num = count + 1
        while True:
            user_code = f"USR{num:04d}"
            existing_user = await self.repo.collection.find_one({"user_code": user_code})
            if not existing_user:
                break
            num += 1

        password_hash = hash_password(data.password)
        db_role = API_TO_DB_ROLE.get(data.role.value, "Inspector")

        user_doc = {
            "user_code": user_code,
            "full_name": data.full_name,
            "email": data.email,
            "password_hash": password_hash,
            "role": db_role,
        }

        user_id = await self.repo.create(user_doc)
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise BadRequestException("User creation failed")

        logger.info("User created: %s (%s)", user_id, user_code)
        return serialize_user(user)

    async def update_user(self, user_id: str, data: UserUpdate) -> dict:
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")

        update_data = {}
        if data.full_name is not None:
            update_data["full_name"] = data.full_name

        if data.email is not None:
            if data.email != user.get("email"):
                existing = await self.repo.get_by_email(data.email)
                if existing:
                    raise ConflictException("Email already in use")
            update_data["email"] = data.email

        if data.password is not None:
            update_data["password_hash"] = hash_password(data.password)

        if data.role is not None:
            update_data["role"] = API_TO_DB_ROLE.get(data.role.value, "Inspector")

        if update_data:
            updated = await self.repo.update(user_id, update_data)
            if not updated:
                raise NotFoundException("User not found during update")
            user = updated

        logger.info("User updated: %s", user_id)
        return serialize_user(user)

    async def delete_user(self, user_id: str) -> None:
        deleted = await self.repo.delete(user_id)
        if not deleted:
            raise NotFoundException("User not found")
        logger.info("User deleted: %s", user_id)
