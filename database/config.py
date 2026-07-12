"""
Configuration Module
====================

Central configuration for MongoDB connection and database settings.
All environment-specific values are loaded via environment variables
with sensible defaults for local development.
"""

import os
from typing import Dict, Any


class Settings:
    """Application settings loaded from environment variables."""

    # ── MongoDB Connection ───────────────────────────────────────────
    MONGODB_URI: str = os.getenv(
        "MONGODB_URI",
        "mongodb://localhost:27017",
    )
    MONGODB_USERNAME: str = os.getenv("MONGODB_USERNAME", "")
    MONGODB_PASSWORD: str = os.getenv("MONGODB_PASSWORD", "")
    MONGODB_AUTH_SOURCE: str = os.getenv("MONGODB_AUTH_SOURCE", "admin")
    MONGODB_AUTH_MECHANISM: str = os.getenv(
        "MONGODB_AUTH_MECHANISM", "SCRAM-SHA-256"
    )

    # ── Database ─────────────────────────────────────────────────────
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "durian_guardian_ai")

    # ── Connection Pool ──────────────────────────────────────────────
    MIN_POOL_SIZE: int = int(os.getenv("MIN_POOL_SIZE", "5"))
    MAX_POOL_SIZE: int = int(os.getenv("MAX_POOL_SIZE", "50"))
    CONNECT_TIMEOUT_MS: int = int(os.getenv("CONNECT_TIMEOUT_MS", "5000"))
    SERVER_SELECTION_TIMEOUT_MS: int = int(
        os.getenv("SERVER_SELECTION_TIMEOUT_MS", "5000")
    )
    SOCKET_TIMEOUT_MS: int = int(os.getenv("SOCKET_TIMEOUT_MS", "30000"))
    MAX_IDLE_TIME_MS: int = int(os.getenv("MAX_IDLE_TIME_MS", "600000"))
    RETRY_WRITES: bool = os.getenv("RETRY_WRITES", "true").lower() == "true"

    # ── Logging ──────────────────────────────────────────────────────
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    @property
    def mongodb_uri_with_credentials(self) -> str:
        """Build MongoDB URI with embedded credentials if provided."""
        if self.MONGODB_USERNAME and self.MONGODB_PASSWORD:
            from urllib.parse import quote_plus

            user = quote_plus(self.MONGODB_USERNAME)
            pwd = quote_plus(self.MONGODB_PASSWORD)
            base_uri = self.MONGODB_URI.replace(
                "mongodb://", f"mongodb://{user}:{pwd}@"
            ).replace(
                "mongodb+srv://", f"mongodb+srv://{user}:{pwd}@"
            )
            return base_uri
        return self.MONGODB_URI

    @property
    def connection_kwargs(self) -> Dict[str, Any]:
        """Return keyword arguments for MongoClient construction."""
        kwargs: Dict[str, Any] = {
            "minPoolSize": self.MIN_POOL_SIZE,
            "maxPoolSize": self.MAX_POOL_SIZE,
            "connectTimeoutMS": self.CONNECT_TIMEOUT_MS,
            "serverSelectionTimeoutMS": self.SERVER_SELECTION_TIMEOUT_MS,
            "socketTimeoutMS": self.SOCKET_TIMEOUT_MS,
            "maxIdleTimeMS": self.MAX_IDLE_TIME_MS,
            "retryWrites": self.RETRY_WRITES,
        }
        if self.MONGODB_USERNAME and self.MONGODB_PASSWORD:
            kwargs["username"] = self.MONGODB_USERNAME
            kwargs["password"] = self.MONGODB_PASSWORD
            kwargs["authSource"] = self.MONGODB_AUTH_SOURCE
            kwargs["authMechanism"] = self.MONGODB_AUTH_MECHANISM
        return kwargs


settings = Settings()
