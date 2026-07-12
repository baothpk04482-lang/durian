from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field


# --- Original AI/History schemas ---
class DetectionResult(BaseModel):
    disease: str
    confidence: float
    severity: str


class DetectionResponse(BaseModel):
    tree_id: str
    image_url: str
    detection: DetectionResult
    created_at: datetime


class DiseaseHistoryOut(BaseModel):
    id: str
    tree_id: str
    disease: str
    date: datetime
    action: str
    created_at: datetime


# --- New Diseases CRUD schemas ---
class DiseaseCreate(BaseModel):
    code: str = Field(..., min_length=1)
    name: str = Field(..., min_length=1)
    affected_part: str | None = None
    severity: str | None = None
    description: str | None = None
    recommendation: str | None = None


class DiseaseUpdate(BaseModel):
    code: str | None = None
    name: str | None = None
    affected_part: str | None = None
    severity: str | None = None
    description: str | None = None
    recommendation: str | None = None


class DiseaseOut(BaseModel):
    id: str
    code: str
    name: str
    affected_part: str | None = None
    severity: str | None = None
    description: str | None = None
    recommendation: str | None = None
    created_at: datetime
