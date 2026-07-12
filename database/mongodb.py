"""
MongoDB Connection Module
=========================

Manages a singleton MongoDB client connection with connection pooling,
health checks, and graceful shutdown.
"""

import logging
from typing import Optional

from pymongo import MongoClient
from pymongo.database import Database
from pymongo.errors import (
    ConnectionFailure,
    ServerSelectionTimeoutError,
    OperationFailure,
)

from database.config import settings

logger = logging.getLogger("durian_guardian.mongodb")


class MongoDBConnection:
    """Thread-safe MongoDB client wrapper with singleton pattern."""

    _instance: Optional["MongoDBConnection"] = None
    _client: Optional[MongoClient] = None
    _db: Optional[Database] = None

    def __new__(cls) -> "MongoDBConnection":
        """Ensure singleton instance."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        """Initialize connection on first call only."""
        if getattr(self, "_initialized", False):
            return
        self._initialized = True
        self._client = None
        self._db = None
        logger.info("MongoDBConnection singleton created.")

    # ── Connection Management ────────────────────────────────────────

    def connect(self) -> None:
        """
        Establish connection to MongoDB.

        Raises:
            ConnectionFailure: If unable to connect to MongoDB.
            ServerSelectionTimeoutError: If server selection times out.
        """
        if self._client is not None:
            logger.debug("Already connected to MongoDB.")
            return

        uri = settings.mongodb_uri_with_credentials
        kwargs = settings.connection_kwargs

        logger.info(
            "Connecting to MongoDB at %s ...",
            settings.MONGODB_URI.replace("mongodb://", "mongodb://***:***@")
            if settings.MONGODB_USERNAME
            else settings.MONGODB_URI,
        )

        try:
            self._client = MongoClient(uri, **kwargs)
            # Verify connection with a ping
            self._client.admin.command("ping")
            self._db = self._client[settings.DATABASE_NAME]
            logger.info(
                "Successfully connected to database: %s",
                settings.DATABASE_NAME,
            )
        except (ConnectionFailure, ServerSelectionTimeoutError) as exc:
            self._client = None
            self._db = None
            logger.error("Failed to connect to MongoDB: %s", exc)
            raise

    def disconnect(self) -> None:
        """Close the MongoDB connection gracefully."""
        if self._client is not None:
            try:
                self._client.close()
                logger.info("Disconnected from MongoDB.")
            except Exception as exc:
                logger.warning("Error during disconnect: %s", exc)
            finally:
                self._client = None
                self._db = None

    def reconnect(self) -> None:
        """Force reconnection by closing and re-opening."""
        self.disconnect()
        self.connect()

    # ── Accessors ────────────────────────────────────────────────────

    @property
    def client(self) -> MongoClient:
        """Return the MongoClient instance."""
        if self._client is None:
            self.connect()
        return self._client  # type: ignore[return-value]

    @property
    def db(self) -> Database:
        """Return the application Database instance."""
        if self._db is None:
            self.connect()
        return self._db  # type: ignore[return-value]

    def get_database(self, db_name: Optional[str] = None) -> Database:
        """
        Get a database instance by name or return the default.

        Args:
            db_name: Optional database name. Defaults to DATABASE_NAME.

        Returns:
            Database instance.
        """
        target = db_name or settings.DATABASE_NAME
        return self.client[target]

    # ── Health Check ─────────────────────────────────────────────────

    def health_check(self) -> bool:
        """
        Ping MongoDB to verify the connection is alive.

        Returns:
            True if MongoDB is reachable, False otherwise.
        """
        try:
            self.client.admin.command("ping")
            return True
        except (ConnectionFailure, ServerSelectionTimeoutError,
                OperationFailure) as exc:
            logger.warning("Health check failed: %s", exc)
            return False

    # ── Context Manager ──────────────────────────────────────────────

    def __enter__(self) -> "MongoDBConnection":
        """Support 'with' statement."""
        self.connect()
        return self

    def __exit__(self, *args) -> None:
        """Clean up on exit."""
        self.disconnect()


# Module-level convenience instance
mongo_conn = MongoDBConnection()


def get_database() -> Database:
    """Shortcut to get the default database instance."""
    return mongo_conn.db


def get_client() -> MongoClient:
    """Shortcut to get the MongoClient instance."""
    return mongo_conn.client
