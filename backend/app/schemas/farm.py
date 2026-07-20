from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class FarmCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    address: str | None = Field(None, max_length=500)
    gps_lat: float | None = Field(None, ge=-90, le=90)
    gps_lng: float | None = Field(None, ge=-180, le=180)
    area: float | None = Field(None, ge=0)
    farm_code: str = Field(..., min_length=1)
    company_id: str = Field(..., min_length=1)
    district: str = Field(..., min_length=1)


class FarmUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    address: str | None = Field(None, max_length=500)
    gps_lat: float | None = Field(None, ge=-90, le=90)
    gps_lng: float | None = Field(None, ge=-180, le=180)
    area: float | None = Field(None, ge=0)
    farm_code: str | None = Field(None, min_length=1)
    company_id: str | None = Field(None, min_length=1)
    district: str | None = Field(None, min_length=1)


class FarmOut(BaseModel):
    id: str
    name: str
    address: str | None
    gps_lat: float | None
    gps_lng: float | None
    area: float | None
    company_id: str
    created_at: datetime
