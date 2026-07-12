from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.exceptions import (
    ForbiddenException,
    UnauthorizedException,
)
from app.core.security import decode_token
from app.database.mongodb import get_database

security = HTTPBearer(auto_error=False)


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> str:
    if credentials is None:
        raise UnauthorizedException("Missing authorization header")
    payload = decode_token(credentials.credentials)
    sub = payload.get("sub")
    if sub is None:
        raise UnauthorizedException("Invalid or expired token")
    return str(sub)


CurrentUserId = Annotated[str, Depends(get_current_user_id)]


def get_current_user_role(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> str:
    if credentials is None:
        raise UnauthorizedException("Missing authorization header")
    payload = decode_token(credentials.credentials)
    role = payload.get("role")
    if role is None:
        raise UnauthorizedException("Invalid or expired token")
    
    role_map = {
        "Admin": "enterprise_admin",
        "Manager": "farm_manager",
        "Inspector": "field_technician",
        "Farmer": "farmer"
    }
    return role_map.get(role, role)


CurrentUserRole = Annotated[str, Depends(get_current_user_role)]


DBDep = Annotated[AsyncIOMotorDatabase, Depends(get_database)]


class RoleChecker:
    def __init__(self, allowed_roles: list[str]) -> None:
        self.allowed_roles = allowed_roles

    async def __call__(
        self, role: str = Depends(get_current_user_role)
    ) -> str:
        if role not in self.allowed_roles:
            raise ForbiddenException(
                f"Role '{role}' is not allowed. Required: {self.allowed_roles}"
            )
        return role


def pagination_params(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
) -> tuple[int, int]:
    return page, per_page


PaginationDep = Annotated[tuple[int, int], Depends(pagination_params)]
