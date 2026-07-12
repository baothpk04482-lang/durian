from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field


class DetectionResultCreate(BaseModel):
    inspection_id: str = Field(..., min_length=1)
    model: str = Field(..., min_length=1)
    prediction: str = Field(..., min_length=1)
    confidence: float = Field(..., ge=0.0, le=100.0)


class DetectionResultUpdate(BaseModel):
    inspection_id: str | None = None
    model: str | None = None
    prediction: str | None = None
    confidence: float | None = Field(None, ge=0.0, le=100.0)


class DetectionResultOut(BaseModel):
    id: str
    inspection_id: str
    model: str
    prediction: str
    confidence: float
    created_at: datetime
