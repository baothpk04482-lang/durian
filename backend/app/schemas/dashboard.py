from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class DetectionBrief(BaseModel):
    disease: str
    confidence: float
    severity: str
    tree_code: str
    created_at: datetime


class AlertBrief(BaseModel):
    title: str
    content: str
    created_at: datetime


class KpiData(BaseModel):
    total_farms: int
    total_trees: int
    healthy_trees: int
    diseased_trees: int
    high_risk_trees: int


class RiskTrendItem(BaseModel):
    date: str
    avg_risk: float


class DashboardOut(BaseModel):
    kpi: KpiData
    recent_detection: list[DetectionBrief]
    alerts: list[AlertBrief]
    risk_trend: list[RiskTrendItem]
