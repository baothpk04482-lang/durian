from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from app.models.enums import UserRole


class UserCreate(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    role: UserRole = UserRole.field_technician


class UserUpdate(BaseModel):
    full_name: str | None = Field(None, min_length=1, max_length=255)
    email: EmailStr | None = None
    password: str | None = Field(None, min_length=6, max_length=128)
    role: UserRole | None = None


class UserOut(BaseModel):
    id: str
    user_code: str
    full_name: str
    email: str
    role: UserRole
    created_at: datetime
