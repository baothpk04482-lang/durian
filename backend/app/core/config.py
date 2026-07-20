from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    APP_NAME: str = "Durian Guardian AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "durian_guardian_ai"

    JWT_SECRET_KEY: str = "change-this-to-a-secure-random-string"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    CORS_ORIGINS: str = (
    "http://localhost:3000,"
    "http://localhost:5173,"
    "http://localhost:5174"
)

    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 10

    LOG_LEVEL: str = "INFO"

    @property
    def CORS_ORIGINS_LIST(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    @property
    def JWT_ACCESS_TOKEN_EXPIRE_SECONDS(self) -> int:
        return self.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60

    @property
    def JWT_REFRESH_TOKEN_EXPIRE_SECONDS(self) -> int:
        return self.JWT_REFRESH_TOKEN_EXPIRE_DAYS * 86400

    @property
    def MAX_UPLOAD_SIZE_BYTES(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024


    def model_post_init(self, __context: object) -> None:
        if self.JWT_SECRET_KEY == "change-this-to-a-secure-random-string":
            import os
            if os.getenv("ENVIRONMENT", "development").lower() == "production":
                raise ValueError(
                    "JWT_SECRET_KEY must be set to a secure value in production. "
                    "Set the JWT_SECRET_KEY environment variable."
                )


settings = Settings()
