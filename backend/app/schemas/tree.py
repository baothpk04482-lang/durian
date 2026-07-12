from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, Field


class TreeCreate(BaseModel):
    zone_id: str
    tree_code: str = Field(..., min_length=1, max_length=100)
    variety: str | None = Field(None, max_length=255)
    planting_date: date | None = None
    age: int | None = Field(None, ge=0)
    gps_lat: float | None = Field(None, ge=-90, le=90)
    gps_lng: float | None = Field(None, ge=-180, le=180)
    status: str = Field("Healthy", pattern="^(Healthy|Monitoring|Diseased)$")


class TreeUpdate(BaseModel):
    tree_code: str | None = Field(None, min_length=1, max_length=100)
    variety: str | None = Field(None, max_length=255)
    planting_date: date | None = None
    age: int | None = Field(None, ge=0)
    gps_lat: float | None = Field(None, ge=-90, le=90)
    gps_lng: float | None = Field(None, ge=-180, le=180)
    status: str | None = Field(None, pattern="^(Healthy|Monitoring|Diseased)$")


class TreeOut(BaseModel):
    id: str
    zone_id: str
    tree_code: str
    variety: str | None
    planting_date: date | None
    age: int | None
    gps_lat: float | None
    gps_lng: float | None
    created_at: datetime
