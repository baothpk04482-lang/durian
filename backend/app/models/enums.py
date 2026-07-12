from __future__ import annotations

import enum


class UserRole(str, enum.Enum):
    farmer = "farmer"
    field_technician = "field_technician"
    farm_manager = "farm_manager"
    enterprise_admin = "enterprise_admin"


class NotificationStatus(str, enum.Enum):
    unread = "unread"
    read = "read"
    archived = "archived"


class SeverityLevel(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
