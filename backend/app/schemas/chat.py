from __future__ import annotations

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1)
    tree_id: str


class ChatResponse(BaseModel):
    answer: str
