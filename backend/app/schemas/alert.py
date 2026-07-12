from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field


class AlertCreate(BaseModel):
    farm_id: str = Field(..., min_length=1)
    tree_id: str = Field(..., min_length=1)
    alert_type: str = Field(..., min_length=1)
    priority: str = Field(..., min_length=1)
    date: datetime


class AlertUpdate(BaseModel):
    farm_id: str | None = None
    tree_id: str | None = None
    alert_type: str | None = None
    priority: str | None = None
    date: datetime | None = None


class AlertOut(BaseModel):
    id: str
    farm_id: str
    tree_id: str
    alert_type: str
    priority: str
    date: datetime
    created_at: datetime
