"""
Schema Definitions
==================

Collection names, JSON Schema validators, and type hints
for all 10 MongoDB collections in Durian Guardian AI.

Validators match the EXACT document structure produced
by the Excel ETL pipeline — never reject valid data.
"""

from typing import Dict, Any, List


class Collections:
    """Central registry of all collection names."""

    COMPANIES: str = "companies"
    FARMS: str = "farms"
    ZONES: str = "zones"
    TREES: str = "trees"
    USERS: str = "users"
    DISEASES: str = "diseases"
    INSPECTIONS: str = "inspections"
    DETECTION_RESULTS: str = "detection_results"
    DISEASE_HISTORY: str = "disease_history"
    ALERTS: str = "alerts"

    @classmethod
    def all(cls) -> List[str]:
        return [
            cls.COMPANIES, cls.FARMS, cls.ZONES, cls.TREES,
            cls.USERS, cls.DISEASES, cls.INSPECTIONS,
            cls.DETECTION_RESULTS, cls.DISEASE_HISTORY, cls.ALERTS,
        ]

    @classmethod
    def seed_collections(cls) -> List[str]:
        """Collections that receive seed data from Excel."""
        return [
            cls.COMPANIES, cls.FARMS, cls.ZONES, cls.TREES,
            cls.USERS, cls.DISEASES, cls.INSPECTIONS,
            cls.DETECTION_RESULTS, cls.DISEASE_HISTORY, cls.ALERTS,
        ]


def get_collection_validators() -> Dict[str, Dict[str, Any]]:
    """Return MongoDB JSON Schema validators for all collections."""
    return {
        Collections.COMPANIES: {
            "$jsonSchema": {
                "bsonType": "object",
                "title": "Company Validation",
                "required": ["company_code", "company_name", "district", "province"],
                "properties": {
                    "_id": {"bsonType": "objectId"},
                    "company_code": {"bsonType": "string", "description": "COMP001-COMP010"},
                    "company_name": {"bsonType": "string", "description": "Company legal name"},
                    "district": {"bsonType": "string", "description": "District location"},
                    "province": {"bsonType": "string", "description": "All in Đắk Lắk"},
                    "created_at": {"bsonType": "date"},
                },
            }
        },
        Collections.FARMS: {
            "$jsonSchema": {
                "bsonType": "object",
                "title": "Farm Validation",
                "required": ["farm_code", "farm_name", "company_id", "district"],
                "properties": {
                    "_id": {"bsonType": "objectId"},
                    "farm_code": {"bsonType": "string", "description": "FARM001-FARM010"},
                    "farm_name": {"bsonType": "string", "description": "Farm display name"},
                    "company_id": {"bsonType": "objectId", "description": "Ref companies._id"},
                    "district": {"bsonType": "string", "description": "District location"},
                    "area_hectare": {"bsonType": "double", "minimum": 0},
                    "tree_count": {"bsonType": "int", "minimum": 0},
                    "created_at": {"bsonType": "date"},
                },
            }
        },
        Collections.ZONES: {
            "$jsonSchema": {
                "bsonType": "object",
                "title": "Zone Validation",
                "required": ["farm_id", "zone_name", "tree_count"],
                "properties": {
                    "_id": {"bsonType": "objectId"},
                    "farm_id": {"bsonType": "objectId", "description": "Ref farms._id"},
                    "zone_name": {"bsonType": "string", "description": "ZONE_A to ZONE_J"},
                    "tree_count": {"bsonType": "int", "minimum": 0},
                    "created_at": {"bsonType": "date"},
                },
            }
        },
        Collections.TREES: {
            "$jsonSchema": {
                "bsonType": "object",
                "title": "Tree Validation",
                "required": ["tree_code", "farm_id", "zone_id", "variety", "planting_date", "tree_age", "status"],
                "properties": {
                    "_id": {"bsonType": "objectId"},
                    "tree_code": {"bsonType": "string", "description": "Unique tree ID (TREE00001+)"},
                    "farm_id": {"bsonType": "objectId", "description": "Ref farms._id"},
                    "zone_id": {"bsonType": "objectId", "description": "Ref zones._id"},
                    "variety": {"bsonType": "string", "description": "Monthong/Dona/Musang King/Ri6"},
                    "planting_date": {"bsonType": "date"},
                    "tree_age": {"bsonType": "int", "minimum": 0},
                    "status": {"enum": ["Healthy", "Monitoring", "Diseased"]},
                    "created_at": {"bsonType": "date"},
                },
            }
        },
        Collections.USERS: {
            "$jsonSchema": {
                "bsonType": "object",
                "title": "User Validation",
                "required": ["user_code", "full_name", "role"],
                "properties": {
                    "_id": {"bsonType": "objectId"},
                    "user_code": {"bsonType": "string", "description": "USR001-USR050"},
                    "full_name": {"bsonType": "string"},
                    "role": {"enum": ["Admin", "Company Manager", "Farm Manager", "Inspector", "Technician"]},
                    "email": {"bsonType": ["string", "null"]},
                    "password_hash": {"bsonType": ["string", "null"]},
                    "created_at": {"bsonType": "date"},
                },
            }
        },
        Collections.DISEASES: {
            "$jsonSchema": {
                "bsonType": "object",
                "title": "Disease Validation",
                "required": ["code", "name"],
                "properties": {
                    "_id": {"bsonType": "objectId"},
                    "code": {"bsonType": "string", "description": "Normalized code from name"},
                    "name": {"bsonType": "string", "description": "Disease display name"},
                    "created_at": {"bsonType": "date"},
                },
            }
        },
        Collections.INSPECTIONS: {
            "$jsonSchema": {
                "bsonType": "object",
                "title": "Inspection Validation",
                "required": [
                    "inspection_code", "tree_id", "farm_id",
                    "inspection_date", "health_status",
                    "predicted_disease", "confidence",
                ],
                "properties": {
                    "_id": {"bsonType": "objectId"},
                    "inspection_code": {"bsonType": "string"},
                    "tree_id": {"bsonType": "objectId", "description": "Ref trees._id"},
                    "farm_id": {"bsonType": "objectId", "description": "Ref farms._id"},
                    "disease_id": {"bsonType": ["objectId", "null"], "description": "Ref diseases._id"},
                    "inspection_date": {"bsonType": "date"},
                    "temperature": {"bsonType": "double"},
                    "humidity": {"bsonType": "double"},
                    "rainfall": {"bsonType": "double", "minimum": 0},
                    "health_status": {"enum": ["Healthy", "Diseased"]},
                    "predicted_disease": {"bsonType": "string"},
                    "confidence": {"bsonType": "double", "minimum": 0, "maximum": 100},
                    "created_at": {"bsonType": "date"},
                },
            }
        },
        Collections.DETECTION_RESULTS: {
            "$jsonSchema": {
                "bsonType": "object",
                "title": "Detection Result Validation",
                "required": ["inspection_id", "model", "prediction", "confidence"],
                "properties": {
                    "_id": {"bsonType": "objectId"},
                    "inspection_id": {"bsonType": "objectId", "description": "Ref inspections._id"},
                    "model": {"bsonType": "string"},
                    "prediction": {"bsonType": "string"},
                    "confidence": {"bsonType": "double", "minimum": 0, "maximum": 100},
                    "created_at": {"bsonType": "date"},
                },
            }
        },
        Collections.DISEASE_HISTORY: {
            "$jsonSchema": {
                "bsonType": "object",
                "title": "Disease History Validation",
                "required": ["tree_id", "disease", "date", "action"],
                "properties": {
                    "_id": {"bsonType": "objectId"},
                    "tree_id": {"bsonType": "objectId", "description": "Ref trees._id"},
                    "disease": {"bsonType": "string"},
                    "date": {"bsonType": "date"},
                    "action": {"bsonType": "string"},
                    "created_at": {"bsonType": "date"},
                },
            }
        },
        Collections.ALERTS: {
            "$jsonSchema": {
                "bsonType": "object",
                "title": "Alert Validation",
                "required": ["farm_id", "tree_id", "alert_type", "priority", "date"],
                "properties": {
                    "_id": {"bsonType": "objectId"},
                    "farm_id": {"bsonType": "objectId", "description": "Ref farms._id"},
                    "tree_id": {"bsonType": "objectId", "description": "Ref trees._id"},
                    "alert_type": {"bsonType": "string"},
                    "priority": {"bsonType": "string"},
                    "date": {"bsonType": "date"},
                    "created_at": {"bsonType": "date"},
                },
            }
        },
    }
