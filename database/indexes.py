"""
Index Definitions
=================

MongoDB index specifications for all 10 collections.
Only essential indexes for production query patterns.
"""

from typing import Dict, Any, List

from database.db_schema import Collections


def get_index_specs() -> Dict[str, List[Dict[str, Any]]]:
    """Return index definitions for all collections."""
    return {
        Collections.COMPANIES: [
            {"keys": [("company_name", 1)], "name": "idx_companies_name", "unique": True},
        ],
        Collections.FARMS: [
            {"keys": [("company_id", 1)], "name": "idx_farms_company_id"},
            {"keys": [("farm_name", 1)], "name": "idx_farms_name"},
        ],
        Collections.ZONES: [
            {"keys": [("farm_id", 1), ("zone_name", 1)], "name": "idx_zones_farm_zone", "unique": True},
        ],
        Collections.TREES: [
            {"keys": [("tree_code", 1)], "name": "idx_trees_code_unique", "unique": True},
            {"keys": [("farm_id", 1)], "name": "idx_trees_farm_id"},
            {"keys": [("zone_id", 1)], "name": "idx_trees_zone_id"},
            {"keys": [("status", 1)], "name": "idx_trees_status"},
        ],
        Collections.USERS: [
            {"keys": [("user_code", 1)], "name": "idx_users_code_unique", "unique": True},
        ],
        Collections.DISEASES: [
            {"keys": [("code", 1)], "name": "idx_diseases_code_unique", "unique": True},
        ],
        Collections.INSPECTIONS: [
            {"keys": [("tree_id", 1)], "name": "idx_inspections_tree_id"},
            {"keys": [("inspection_date", -1)], "name": "idx_inspections_date_desc"},
            {"keys": [("predicted_disease", 1)], "name": "idx_inspections_disease"},
            {"keys": [("health_status", 1)], "name": "idx_inspections_health"},
        ],
        Collections.DETECTION_RESULTS: [
            {"keys": [("inspection_id", 1)], "name": "idx_detections_inspection_id"},
            {"keys": [("confidence", -1)], "name": "idx_detections_confidence"},
        ],
        Collections.ALERTS: [
            {"keys": [("created_at", -1)], "name": "idx_alerts_created_at"},
            {"keys": [("priority", 1)], "name": "idx_alerts_priority"},
        ],
    }
