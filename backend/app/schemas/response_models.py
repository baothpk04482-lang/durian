from __future__ import annotations

from typing import Any, Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class MessageResponse(BaseModel):
    success: bool = True
    message: str = "Success"
    data: dict[str, Any] = Field(default_factory=dict)


class SuccessResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "Success"
    data: T


class PaginatedData(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    per_page: int


class PaginatedResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "Success"
    data: PaginatedData[T]


class PaginatedWithTotalPagesData(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    per_page: int
    total_pages: int


class PaginatedWithTotalPagesResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "Success"
    data: PaginatedWithTotalPagesData[T]
