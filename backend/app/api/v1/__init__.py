from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.farms import router as farms_router
from app.api.v1.zones import router as zones_router
from app.api.v1.trees import router as trees_router
from app.api.v1.ai import router as ai_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.history import router as history_router
from app.api.v1.chat import router as chat_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.companies import router as companies_router
from app.api.v1.users import router as users_router
from app.api.v1.inspections import router as inspections_router
from app.api.v1.detection_results import router as detection_results_router
from app.api.v1.disease_history import router as disease_history_router
from app.api.v1.diseases import router as diseases_router
from app.api.v1.alerts import router as alerts_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(farms_router)
api_router.include_router(zones_router)
api_router.include_router(trees_router)
api_router.include_router(ai_router)
api_router.include_router(dashboard_router)
api_router.include_router(history_router)
api_router.include_router(chat_router)
api_router.include_router(notifications_router)
api_router.include_router(companies_router)
api_router.include_router(users_router)
api_router.include_router(inspections_router)
api_router.include_router(detection_results_router)
api_router.include_router(disease_history_router)
api_router.include_router(diseases_router)
api_router.include_router(alerts_router)
