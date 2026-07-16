from __future__ import annotations

import logging
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1 import api_router
from app.core.config import settings
from app.core.exception_handlers import register_exception_handlers
from app.core.logging import setup_logging
from app.core.security import hash_password
from app.database.mongodb import MongoDBManager

setup_logging()
logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS_LIST,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)

    app.include_router(api_router)

    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=str(upload_dir)), name="uploads")

    @app.get("/health")
    async def health() -> dict:
        return {"status": "ok", "service": settings.APP_NAME}

    @app.on_event("startup")
    async def _seed_admin_user() -> None:
        db = MongoDBManager.get_db()
        existing = await db["users"].find_one({"email": "bao@gmail.com"})
        if existing:
            return

        now = datetime.now(timezone.utc)
        count = await db["users"].count_documents({})
        user_code = f"USR{count + 1:04d}"

        await db["users"].insert_one(
            {
                "user_code": user_code,
                "full_name": "Bao Admin",
                "fullname": "Bao Admin",
                "email": "bao@gmail.com",
                "password_hash": hash_password("123456"),
                "role": "Admin",
                "refresh_token": "",
                "created_at": now,
                "updated_at": now,
            }
        )
        logger.info("Admin user created: bao@gmail.com")

    return app


app = create_app()
