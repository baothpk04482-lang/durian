from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field


class DiseaseHistoryCreate(BaseModel):
    tree_id: str = Field(..., min_length=1)
    disease: str = Field(..., min_length=1)
    date: datetime
    action: str = Field(..., min_length=1)


class DiseaseHistoryUpdate(BaseModel):
    tree_id: str | None = None
    disease: str | None = None
    date: datetime | None = None
    action: str | None = None


class DiseaseHistoryOut(BaseModel):
    id: str
    tree_id: str
    disease: str
    date: datetime
    action: str
    created_at: datetime
