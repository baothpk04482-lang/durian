from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


import enum

class UserRoleDb(str, enum.Enum):
    Admin = "Admin"
    Company_Manager = "Company Manager"
    Farm_Manager = "Farm Manager"
    Inspector = "Inspector"
    Technician = "Technician"


class UserRegister(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    role: UserRoleDb = UserRoleDb.Inspector


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    full_name: str
    email: str
    role: str
    created_at: datetime


class UserProfileUpdate(BaseModel):
    full_name: str | None = Field(None, min_length=1, max_length=255)
    email: EmailStr | None = None


class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefresh(BaseModel):
    refresh_token: str


class ChangePassword(BaseModel):
    old_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6, max_length=128)
