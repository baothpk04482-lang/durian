#!/usr/bin/env python3
"""
Admin Seed Script
=================

Durian Guardian AI - Seed administrator account.

Creates the default admin account if it does not already exist.
This script is idempotent and safe to run multiple times.

Usage:
    python -m database.seed_admin
"""

import logging
import sys
from datetime import datetime, timezone

from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

from database.config import settings

logger = logging.getLogger("durian_guardian.seed_admin")

# ── Constants ──────────────────────────────────────────────────────
ADMIN_EMAIL = "bao@gmail.com"
ADMIN_PASSWORD = "123456"
ADMIN_ROLE = "Admin"  # DB role for enterprise_admin
ADMIN_FULL_NAME = "Bao Admin"


def hash_password(password: str) -> str:
    """Hash password using bcrypt via passlib."""
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    return pwd_context.hash(password)


def seed_admin(db) -> bool:
    """
    Seed the admin account if it doesn't exist.

    Args:
        db: pymongo Database instance

    Returns:
        True if admin was created, False if already exists
    """
    # Check if admin already exists
    existing = db.users.find_one({"email": ADMIN_EMAIL})
    if existing:
        logger.info("Admin user already exists: %s", ADMIN_EMAIL)
        return False

    # Generate user_code
    count = db.users.count_documents({})
    user_code = f"USR{count + 1:04d}"

    # Create admin document
    now = datetime.now(timezone.utc)
    admin_doc = {
        "user_code": user_code,
        "full_name": ADMIN_FULL_NAME,
        "email": ADMIN_EMAIL,
        "password_hash": hash_password(ADMIN_PASSWORD),
        "role": ADMIN_ROLE,
        "refresh_token": "",
        "created_at": now,
        "updated_at": now,
    }

    # Insert admin
    result = db.users.insert_one(admin_doc)
    logger.info("Admin user created: %s (ID: %s)", ADMIN_EMAIL, result.inserted_id)
    return True


def main() -> None:
    """Main entry point for standalone execution."""
    # Setup logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    logger.info("=" * 60)
    logger.info("  DURIAN GUARDIAN AI - Admin Seed")
    logger.info("=" * 60)

    # Connect to MongoDB
    try:
        client = MongoClient(
            settings.mongodb_uri_with_credentials,
            **settings.connection_kwargs,
        )
        client.admin.command("ping")
        db = client[settings.DATABASE_NAME]
        logger.info("Connected to MongoDB: %s", settings.DATABASE_NAME)
    except (ConnectionFailure, ServerSelectionTimeoutError) as exc:
        logger.critical("Cannot connect to MongoDB: %s", exc)
        sys.exit(1)

    try:
        created = seed_admin(db)
        if created:
            logger.info("Admin seed completed successfully")
        else:
            logger.info("Admin seed skipped (already exists)")
    except Exception as exc:
        logger.error("Admin seed failed: %s", exc)
        sys.exit(1)
    finally:
        client.close()
        logger.info("MongoDB connection closed.")


if __name__ == "__main__":
    main()
