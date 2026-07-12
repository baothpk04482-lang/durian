from __future__ import annotations

import logging

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.repositories import (
    DiseaseRepository,
    FarmRepository,
    NotificationRepository,
    TreeRepository,
)
from app.schemas import AlertBrief, DashboardOut, DetectionBrief, KpiData, RiskTrendItem

logger = logging.getLogger(__name__)


class DashboardService:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.db = db
        self.farm_repo = FarmRepository(db)
        self.tree_repo = TreeRepository(db)
        self.disease_repo = DiseaseRepository(db)
        self.notification_repo = NotificationRepository(db)

    async def get_dashboard(self, user_id: str) -> DashboardOut:
        farms, _ = await self.farm_repo.list_by_owner(user_id, page=1, per_page=100)
        total_farms = len(farms)

        farm_ids = [f["id"] for f in farms]
        total_trees = await self.tree_repo.count_by_farms(farm_ids) if farm_ids else 0
        diseased_trees = await self.disease_repo.count_diseased()
        healthy_trees = max(0, total_trees - diseased_trees)
        high_risk_trees = len(await self.db["alerts"].distinct("tree_id", {"priority": "High"}))

        recent_detection = await self._get_recent_detections()
        alerts = await self._get_alerts()
        risk_trend = await self._get_risk_trend()

        return DashboardOut(
            kpi=KpiData(
                total_farms=total_farms,
                total_trees=total_trees,
                healthy_trees=healthy_trees,
                diseased_trees=diseased_trees,
                high_risk_trees=high_risk_trees,
            ),
            recent_detection=recent_detection,
            alerts=alerts,
            risk_trend=risk_trend,
        )

    async def _get_recent_detections(self) -> list[DetectionBrief]:
        cursor = (
            self.db["detection_results"].find()
            .sort("created_at", -1)
            .limit(10)
        )
        result = []
        async for doc in cursor:
            inspection = await self.db["inspections"].find_one({"_id": doc["inspection_id"]})
            if not inspection:
                continue
            tree = await self.tree_repo.get(str(inspection["tree_id"]))
            tree_code = tree["tree_code"] if tree else "N/A"
            
            conf = doc["confidence"]
            if conf >= 80.0:
                severity = "Severe"
            elif conf >= 50.0:
                severity = "Moderate"
            else:
                severity = "Mild"
                
            result.append(
                DetectionBrief(
                    disease=doc.get("prediction", "N/A"),
                    confidence=conf,
                    severity=severity,
                    tree_code=tree_code,
                    created_at=doc["created_at"],
                )
            )
        return result

    async def _get_alerts(self) -> list[AlertBrief]:
        docs, _ = await self.notification_repo.list(
            page=1, per_page=20, sort=[("created_at", -1)]
        )
        return [
            AlertBrief(
                title=doc.get("title", doc.get("alert_type", "Alert")),
                content=doc.get("content", f"System warning priority: {doc.get('priority', 'N/A')}"),
                created_at=doc["created_at"],
            )
            for doc in docs
        ]

    async def _get_risk_trend(self) -> list[RiskTrendItem]:
        pipeline = [
            {
                "$project": {
                    "date_str": {"$dateToString": {"format": "%Y-%m-%d", "date": "$date"}},
                    "risk_val": {
                        "$switch": {
                            "branches": [
                                {"case": {"$eq": ["$priority", "High"]}, "then": 0.8},
                                {"case": {"$eq": ["$priority", "Medium"]}, "then": 0.5},
                                {"case": {"$eq": ["$priority", "Low"]}, "then": 0.2}
                            ],
                            "default": 0.0
                        }
                    }
                }
            },
            {
                "$group": {
                    "_id": "$date_str",
                    "avg_risk": {"$avg": "$risk_val"}
                }
            },
            {"$sort": {"_id": 1}},
            {"$limit": 14},
        ]
        try:
            cursor = self.db["alerts"].aggregate(pipeline)
            items = []
            async for doc in cursor:
                items.append(
                    RiskTrendItem(date=str(doc["_id"]), avg_risk=round(doc["avg_risk"], 4))
                )
            return items
        except Exception as e:
            logger.warning("Failed to compute risk trend: %s", e)
            return []

    async def get_heatmap(self) -> list[dict]:
        items = []
        pipeline = [
            {"$match": {"health_status": "Diseased"}},
            {"$sort": {"created_at": -1}},
            {
                "$group": {
                    "_id": "$tree_id",
                    "confidence": {"$first": "$confidence"},
                }
            },
        ]
        try:
            cursor = self.db["inspections"].aggregate(pipeline)
            async for doc in cursor:
                tree = await self.tree_repo.get(str(doc["_id"]))
                if tree and tree.get("gps_lat") and tree.get("gps_lng"):
                    conf = doc["confidence"]
                    if conf >= 80.0:
                        risk_val = 90
                        status = "High"
                    elif conf >= 50.0:
                        risk_val = 50
                        status = "Medium"
                    else:
                        risk_val = 20
                        status = "Low"
                    items.append(
                        {
                            "tree_id": str(doc["_id"]),
                            "lat": tree["gps_lat"],
                            "lng": tree["gps_lng"],
                            "risk": risk_val,
                            "status": status,
                        }
                    )
        except Exception as e:
            logger.warning("Failed to compute heatmap: %s", e)
        return items
