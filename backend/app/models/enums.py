from __future__ import annotations

import enum


class UserRole(str, enum.Enum):
    farmer = "farmer"
    field_technician = "field_technician"
    farm_manager = "farm_manager"
    enterprise_admin = "enterprise_admin"


# ── Single source of truth for DB ↔ API role mapping ──

_DB_TO_API_ROLE: dict[str, str] = {
    "Admin": UserRole.enterprise_admin.value,
    "Company Manager": UserRole.farm_manager.value,
    "Farm Manager": UserRole.farm_manager.value,
    "Inspector": UserRole.field_technician.value,
    "Technician": UserRole.farmer.value,
}

_API_TO_DB_ROLE: dict[str, str] = {v: k for k, v in _DB_TO_API_ROLE.items()}
# Ensure every API role has a DB counterpart (fill gaps)
_API_TO_DB_ROLE.setdefault(UserRole.enterprise_admin.value, "Admin")
_API_TO_DB_ROLE.setdefault(UserRole.farm_manager.value, "Farm Manager")
_API_TO_DB_ROLE.setdefault(UserRole.field_technician.value, "Inspector")
_API_TO_DB_ROLE.setdefault(UserRole.farmer.value, "Technician")


def db_role_to_api(db_role: str) -> str:
    """Convert a DB role string (e.g. 'Admin') to API role value (e.g. 'enterprise_admin')."""
    return _DB_TO_API_ROLE.get(db_role, UserRole.field_technician.value)


def api_role_to_db(api_role: str) -> str:
    """Convert an API role value (e.g. 'enterprise_admin') to DB role string (e.g. 'Admin')."""
    return _API_TO_DB_ROLE.get(api_role, "Inspector")


class NotificationStatus(str, enum.Enum):
    unread = "unread"
    read = "read"
    archived = "archived"


class SeverityLevel(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
