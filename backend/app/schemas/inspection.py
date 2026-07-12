from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field


class InspectionCreate(BaseModel):
    inspection_code: str = Field(..., min_length=1)
    farm_id: str = Field(..., min_length=1)
    zone_id: str = Field(..., min_length=1)
    tree_id: str = Field(..., min_length=1)
    disease_id: str | None = None
    inspection_date: datetime
    temperature: float
    humidity: float
    rainfall: float
    confidence: float = Field(..., ge=0, le=100)
    predicted_disease: str
    health_status: str = Field(..., pattern="^(Healthy|Diseased)$")


class InspectionUpdate(BaseModel):
    farm_id: str | None = None
    zone_id: str | None = None
    tree_id: str | None = None
    disease_id: str | None = None
    inspection_date: datetime | None = None
    temperature: float | None = None
    humidity: float | None = None
    rainfall: float | None = None
    confidence: float | None = Field(None, ge=0, le=100)
    predicted_disease: str | None = None
    health_status: str | None = Field(None, pattern="^(Healthy|Diseased)$")


class InspectionOut(BaseModel):
    id: str
    inspection_code: str
    farm_id: str
    zone_id: str
    tree_id: str
    disease_id: str | None = None
    inspection_date: datetime
    temperature: float
    humidity: float
    rainfall: float
    confidence: float
    predicted_disease: str
    health_status: str
    created_at: datetime
