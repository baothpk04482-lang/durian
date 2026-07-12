from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.models import NotificationStatus


class NotificationCreate(BaseModel):
    farm_id: str
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1)
    status: NotificationStatus = NotificationStatus.unread


class NotificationUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=255)
    content: str | None = Field(None, min_length=1)
    status: NotificationStatus | None = None


class NotificationOut(BaseModel):
    id: str
    farm_id: str
    title: str
    content: str
    status: str
    created_at: datetime
