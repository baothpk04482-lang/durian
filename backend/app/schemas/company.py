from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class CompanyCreate(BaseModel):
    company_code: str = Field(..., min_length=1, max_length=100)
    company_name: str = Field(..., min_length=1, max_length=255)
    district: str = Field(..., min_length=1, max_length=255)
    province: str = Field(..., min_length=1, max_length=255)


class CompanyUpdate(BaseModel):
    company_code: str | None = Field(None, min_length=1, max_length=100)
    company_name: str | None = Field(None, min_length=1, max_length=255)
    district: str | None = Field(None, min_length=1, max_length=255)
    province: str | None = Field(None, min_length=1, max_length=255)


class CompanyOut(BaseModel):
    id: str
    company_code: str
    company_name: str
    district: str
    province: str
    created_at: datetime
    total_farms: int | None = 0
    total_zones: int | None = 0
    total_trees: int | None = 0
