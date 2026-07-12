from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_token(data: dict[str, Any], expires_delta: int) -> str:
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + timedelta(seconds=expires_delta)
    to_encode.update({"exp": expire, "iat": now})
    return jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def create_access_token(sub: str, role: str) -> str:
    return create_token(
        {"sub": sub, "role": role, "type": "access"},
        settings.JWT_ACCESS_TOKEN_EXPIRE_SECONDS,
    )


def create_refresh_token(sub: str, role: str) -> str:
    return create_token(
        {"sub": sub, "role": role, "type": "refresh"},
        settings.JWT_REFRESH_TOKEN_EXPIRE_SECONDS,
    )


def decode_token(token: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except JWTError:
        return {}
