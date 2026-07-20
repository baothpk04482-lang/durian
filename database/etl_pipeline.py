#!/usr/bin/env python3
"""
ETL Pipeline — Durian Guardian AI
===================================

Extract, Transform, Load pipeline for the DGA seed dataset.

The CSV is the ONLY source of truth. This pipeline:
  1. Reads every row from the CSV
  2. Normalizes duplicated values across rows
  3. Generates ObjectIds and foreign key references
  4. Converts strings to correct BSON types
  5. Removes duplicates at every level
  6. Loads into 7 collections (companies, farms, zones, trees,
     diseases, inspections -- users, detection_results,
     disease_history, alerts are schema-only)

Usage:
    python -m database.etl_pipeline
    python -m database.etl_pipeline --drop-existing
    python -m database.etl_pipeline --dry-run
"""

import argparse
import csv
import logging
import math
import sys
import time
from datetime import datetime, date, timezone
from typing import Dict, List, Optional, Tuple, Any
import pandas as pd

from bson import ObjectId
from pymongo import MongoClient
from pymongo.errors import (
    ConnectionFailure,
    DuplicateKeyError,
    OperationFailure,
    ServerSelectionTimeoutError,
)
from pymongo.database import Database
from pymongo.collection import Collection

from database.config import settings
from database.db_schema import Collections, get_collection_validators
from database.indexes import get_index_specs
from database.seed import load_diseases

logger = logging.getLogger("durian_guardian.etl")


# ── Constants ────────────────────────────────────────────────────────

CSV_PATH = "D:/Ten_Classes_of_Durian_Leaf_Diseases/DGA_seed_dataset_10000.csv"

DISEASE_NAME_TO_CODE: Dict[str, str] = {
    "Anthracnose": "anthracnose_disease",
    "Canker": "canker_disease",
    "Fruit Rot": "fruit_rot",
    "Mealybug": "mealybug_infestation",
    "Pink Disease": "pink_disease",
    "Sooty Mold": "sooty_mold",
    "Stem Blight": "stem_blight",
    "Stem Cracking Gummosis": "stem_cracking_gummosis",
    "Yellow Leaf": "yellow_leaf",
    "Healthy": "healthy",
}

# ── Logging ───────────────────────────────────────────────────────────

def _setup_logging(verbose: bool = False) -> None:
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        handlers=[logging.StreamHandler(sys.stdout)],
    )


# ── Excel Extraction ───────────────────────────────────────────────────


class ExcelExtract:
    """Structured result of extract_excel().

    Provides individual DataFrames for each sheet (primary API) and
    backward-compatible iteration over inspection-joined flat rows
    so that existing callers work without modification.
    """

    def __init__(
        self,
        companies_df: pd.DataFrame,
        farms_df: pd.DataFrame,
        zones_df: pd.DataFrame,
        trees_df: pd.DataFrame,
        inspections_df: pd.DataFrame,
        flat_rows: List[Dict[str, str]],
    ) -> None:
        self.companies_df = companies_df
        self.farms_df = farms_df
        self.zones_df = zones_df
        self.trees_df = trees_df
        self.inspections_df = inspections_df
        self._flat_rows = flat_rows

    # ── backward-compat: len(extract_excel()) ──────────────────────────
    def __len__(self) -> int:
        return len(self._flat_rows)

    # ── backward-compat: for r in extract_excel() ──────────────────────
    def __iter__(self):
        return iter(self._flat_rows)


def _read_sheet(excel_path: str, sheet_name: str) -> pd.DataFrame:
    """Read a single sheet and strip string columns."""
    df = pd.read_excel(excel_path, sheet_name=sheet_name)
    for col in df.columns:
        if df[col].dtype == object:
            df[col] = df[col].astype(str).str.strip()
    return df


def _build_flat_rows(
    inspections_df: pd.DataFrame,
    trees_farms_comp: pd.DataFrame,
) -> List[Dict[str, str]]:
    """Build inspection-joined flat rows for backward compatibility.

    This preserves the exact dict structure expected by all existing
    transform_* functions.  It will be removed once those functions
    are refactored to consume individual DataFrames directly.
    """
    flat_df = pd.merge(
        inspections_df,
        trees_farms_comp,
        on="tree_code",
        how="left",
        suffixes=("_insp", ""),
    )

    def clean_val(v):
        if pd.isna(v):
            return ""
        if isinstance(v, (datetime, pd.Timestamp)):
            return v.strftime("%Y-%m-%d")
        return str(v).strip()

    flat_rows: List[Dict[str, str]] = []
    for _, row in flat_df.iterrows():
        province = clean_val(row.get("province", "Đắk Lắk"))
        district = clean_val(row.get("district", ""))
        district_str = f"{province} - {district}" if district else province

        flat_rows.append(
            {
                "company": clean_val(row.get("company_name", "")),
                "company_code": clean_val(row.get("company_code", "")),
                "district": district_str,
                "farm_id": clean_val(row.get("farm_code", "")),
                "farm_name": clean_val(row.get("farm_name", "")),
                "farm_tree_count": clean_val(row.get("farm_tree_count", "")),
                "zone": clean_val(row.get("zone_name", "")),
                "zone_tree_count": clean_val(row.get("zone_tree_count", "")),
                "tree_code": clean_val(row.get("tree_code", "")),
                "variety": clean_val(row.get("variety", "")),
                "planting_date": clean_val(row.get("planting_date", "")),
                "tree_age": clean_val(row.get("tree_age", "")),
                "tree_status": clean_val(row.get("status", "")),
                "status": clean_val(row.get("health_status", "")),
                "latitude": "",
                "longitude": "",
                "inspection_date": clean_val(row.get("inspection_date", "")),
                "disease": clean_val(row.get("predicted_disease", "")),
                "confidence": clean_val(row.get("confidence", "")),
                "temperature": clean_val(row.get("temperature", "")),
                "humidity": clean_val(row.get("humidity", "")),
                "rainfall_mm": clean_val(row.get("rainfall", "")),
                "wind_speed": "",
                "severity": "",
                "inspection_id": clean_val(row.get("inspection_code", "")),
                "area_hectare": clean_val(row.get("area_hectare", "")),
            }
        )
    return flat_rows


def extract_excel() -> ExcelExtract:
    """Read every Excel sheet and return structured extraction result.

    Each sheet is returned as a separate DataFrame.  A backward-compatible
    list of inspection-joined flat-row dicts is also included so that
    existing callers (run_etl, transform_*) continue to work unchanged.
    """
    excel_path = r"D:\data\DGA_Enterprise_Dataset.xlsx"
    logger.info("Extracting data from Excel: %s", excel_path)

    # ── Read each sheet individually ───────────────────────────────────
    companies_df = _read_sheet(excel_path, "companies")
    farms_df = _read_sheet(excel_path, "farms")
    zones_df = _read_sheet(excel_path, "zones")
    trees_df = _read_sheet(excel_path, "trees")
    inspections_df = _read_sheet(excel_path, "inspections")

    logger.info(
        "Read sheets — companies: %d, farms: %d, zones: %d, trees: %d, inspections: %d",
        len(companies_df),
        len(farms_df),
        len(zones_df),
        len(trees_df),
        len(inspections_df),
    )

    # ── Build inspection-joined flat rows (backward compat) ────────────
    # Use temporary copies with renamed columns so the originals stored
    # in ExcelExtract keep their original column names.
    farms_merge = farms_df.rename(columns={"tree_count": "farm_tree_count"})
    zones_merge = zones_df.rename(columns={"tree_count": "zone_tree_count"})
    trees_farms = pd.merge(trees_df, farms_merge, on="farm_code", how="left")
    trees_farms = pd.merge(
        trees_farms, zones_merge, on=["farm_code", "zone_name"], how="left"
    )
    trees_farms_comp = pd.merge(
        trees_farms,
        companies_df,
        on="company_code",
        how="left",
        suffixes=("", "_comp"),
    )
    flat_rows = _build_flat_rows(inspections_df, trees_farms_comp)

    logger.info("Extracted %d flat rows (inspection-joined, backward compat)", len(flat_rows))

    return ExcelExtract(
        companies_df=companies_df,
        farms_df=farms_df,
        zones_df=zones_df,
        trees_df=trees_df,
        inspections_df=inspections_df,
        flat_rows=flat_rows,
    )


# ── Helpers ──────────────────────────────────────────────────────────

def parse_date(val: str) -> Optional[datetime]:
    """Parse date string to datetime, return None on failure."""
    if not val or not val.strip():
        return None
    val = val.strip()
    for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%d", "%Y/%m/%d"):
        try:
            return datetime.strptime(val, fmt)
        except ValueError:
            continue
    try:
        return datetime.fromisoformat(val)
    except (ValueError, TypeError):
        return None


def parse_float(val: str) -> Optional[float]:
    """Parse string to float, return None on failure."""
    if not val or not val.strip():
        return None
    try:
        return round(float(val.strip()), 6)
    except (ValueError, TypeError):
        return None


def parse_int(val: str) -> Optional[int]:
    """Parse string to int, return None on failure."""
    if not val or not val.strip():
        return None
    try:
        return int(float(val.strip()))
    except (ValueError, TypeError):
        return None



# ── ETL Statistics ───────────────────────────────────────────────────

class ETLStats:
    def __init__(self) -> None:
        self.csv_rows: int = 0
        self.companies_loaded: int = 0
        self.farms_loaded: int = 0
        self.zones_loaded: int = 0
        self.users_loaded: int = 0
        self.trees_loaded: int = 0
        self.diseases_loaded: int = 0
        self.inspections_loaded: int = 0
        self.detection_results_loaded: int = 0
        self.disease_history_loaded: int = 0
        self.alerts_loaded: int = 0

        self.companies_removed_duplicates: int = 0
        self.farms_removed_duplicates: int = 0
        self.zones_removed_duplicates: int = 0
        self.users_removed_duplicates: int = 0
        self.trees_removed_duplicates: int = 0
        self.inspections_removed_duplicates: int = 0
        self.detection_results_removed_duplicates: int = 0
        self.disease_history_removed_duplicates: int = 0
        self.alerts_removed_duplicates: int = 0

        self.invalid_dates: int = 0
        self.orphan_farms: int = 0
        self.orphan_zones: int = 0
        self.orphan_trees: int = 0
        self.orphan_inspections: int = 0
        self.errors: List[str] = []

    def add_error(self, msg: str) -> None:
        self.errors.append(msg)
        logger.error(msg)


# ── TRANSFORM: Companies ─────────────────────────────────────────────

def transform_companies(companies_df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Extract unique companies from the Excel companies sheet."""
    seen = {}  # company_name -> doc
    for _, row in companies_df.iterrows():
        name = str(row.get("company_name", "")).strip()
        if not name or name in seen:
            continue
        seen[name] = {
            "_id": ObjectId(),
            "company_code": str(row.get("company_code", "")).strip(),
            "company_name": name,
            "owner": None,
            "phone": None,
            "email": None,
            "district": str(row.get("district", "")).strip(),
            "province": str(row.get("province", "")).strip(),
            "created_at": datetime.now(timezone.utc),
        }

    companies = list(seen.values())
    logger.info("Transformed %d unique companies from %d Excel rows",
                len(companies), len(companies_df))
    return companies


# ── TRANSFORM: Farms ─────────────────────────────────────────────────

def transform_farms(
    farms_df: pd.DataFrame,
    company_map: Dict[str, ObjectId],
) -> List[Dict[str, Any]]:
    """Extract unique farms from the Excel farms sheet."""
    seen = {}

    for _, row in farms_df.iterrows():
        farm_id = str(row.get("farm_code", "")).strip()
        if not farm_id or farm_id in seen:
            continue

        seen[farm_id] = {
            "_id": ObjectId(),
            "farm_code": farm_id,
            "farm_name": str(row.get("farm_name", "")).strip(),
            "company_id": company_map.get(str(row.get("company_code", "")).strip()),
            "owner": None,
            "phone": None,
            "district": str(row.get("district", "")).strip(),
            "commune": None,
            "latitude": None,
            "longitude": None,
            "area_hectare": parse_float(str(row.get("area_hectare", ""))),
            "tree_count": parse_int(str(row.get("tree_count", ""))),
            "created_at": datetime.now(timezone.utc),
        }

    farms = list(seen.values())
    logger.info("Transformed %d unique farms from %d Excel rows", len(farms), len(farms_df))
    return farms


# ── TRANSFORM: Zones ─────────────────────────────────────────────────

def transform_zones(
    zones_df: pd.DataFrame,
    farm_map: Dict[str, ObjectId],
) -> List[Dict[str, Any]]:
    """Extract unique farm-zone combinations from the Excel zones sheet."""
    seen = {}

    for _, row in zones_df.iterrows():
        farm_id = str(row.get("farm_code", "")).strip()
        zone_name = str(row.get("zone_name", "")).strip()
        if not farm_id or not zone_name:
            continue
        key = (farm_id, zone_name)
        if key in seen:
            continue

        farm_oid = farm_map.get(farm_id)
        if not farm_oid:
            continue
        zone_code = f"{farm_id}_{zone_name.replace(' ', '_')}"
        seen[key] = {
            "_id": ObjectId(),
            "zone_code": zone_code,
            "farm_id": farm_oid,
            "zone_name": zone_name,
            "soil_type": None,
            "irrigation": None,
            "tree_count": parse_int(str(row.get("tree_count", ""))),
            "created_at": datetime.now(timezone.utc),
        }

    zones = list(seen.values())
    logger.info("Transformed %d unique zones from %d Excel rows", len(zones), len(zones_df))
    return zones


# ── TRANSFORM: Trees ─────────────────────────────────────────────────

def transform_trees(
    trees_df: pd.DataFrame,
    inspections_df: pd.DataFrame,
    farm_map: Dict[str, ObjectId],
    zone_map: Dict[str, ObjectId],
    stats: ETLStats,
) -> List[Dict[str, Any]]:
    """Build trees from the Excel trees sheet directly.

    Each row in trees_df is a unique tree. Inspection metadata
    (last_inspection date) is pre-computed from inspections_df.
    """
    # Pre-compute last inspection date per tree_code from inspections
    last_insp_by_tree: Dict[str, Optional[datetime]] = {}
    for _, row in inspections_df.iterrows():
        tree_code = str(row.get("tree_code", "")).strip()
        if not tree_code:
            continue
        dt = parse_date(str(row.get("inspection_date", "")))
        if dt and (tree_code not in last_insp_by_tree or dt > last_insp_by_tree[tree_code]):
            last_insp_by_tree[tree_code] = dt

    trees = []
    for _, row in trees_df.iterrows():
        tree_code = str(row.get("tree_code", "")).strip()
        farm_id = str(row.get("farm_code", "")).strip()
        zone_name = str(row.get("zone_name", "")).strip()
        if not tree_code or not farm_id:
            stats.orphan_trees += 1
            continue

        farm_oid = farm_map.get(farm_id)
        if not farm_oid:
            stats.orphan_trees += 1
            continue

        zone_code = f"{farm_id}_{zone_name.replace(' ', '_')}"
        zone_oid = zone_map.get(zone_code)

        variety = str(row.get("variety", "")).strip()
        planting_dt = parse_date(str(row.get("planting_date", "")))
        tree_age = parse_int(str(row.get("tree_age", "")))
        status = str(row.get("status", "")).strip()
        last_insp = last_insp_by_tree.get(tree_code)
        qr_code = f"QR-{farm_id}-{tree_code}"

        trees.append({
            "_id": ObjectId(),
            "tree_code": tree_code,
            "farm_id": farm_oid,
            "zone_id": zone_oid,
            "variety": variety,
            "planting_date": planting_dt,
            "tree_age": tree_age,
            "status": status,
            "latitude": None,
            "longitude": None,
            "last_inspection": last_insp,
            "qr_code": qr_code,
            "created_at": datetime.now(timezone.utc),
        })

    logger.info("Transformed %d trees from %d Excel rows (uninspected included)",
                len(trees), len(trees_df))
    return trees


# ── TRANSFORM: Diseases ──────────────────────────────────────────────

def transform_diseases() -> List[Dict[str, Any]]:
    """Load disease master data from seed JSON."""
    docs = load_diseases()
    for doc in docs:
        doc["_id"] = ObjectId()
        doc["created_at"] = datetime.now(timezone.utc)
    logger.info("Loaded %d disease records", len(docs))
    return docs


# ── TRANSFORM: Users ─────────────────────────────────────────────────

def transform_users(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Extract and normalize users from Excel rows."""
    users = []
    seen = set()
    for r in rows:
        user_code = str(r.get("user_code", "")).strip()
        if not user_code or user_code in seen:
            continue
        seen.add(user_code)
        
        users.append({
            "_id": ObjectId(),
            "user_code": user_code,
            "full_name": str(r.get("full_name", "")).strip(),
            "role": str(r.get("role", "")).strip(),
            "email": f"{user_code.lower()}@durianguardian.ai",
            "password_hash": None,
            "created_at": datetime.now(timezone.utc),
        })
    logger.info("Transformed %d unique users", len(users))
    return users


# ── TRANSFORM: Combined Diseases ─────────────────────────────────────

def transform_diseases_combined(excel_diseases: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Load disease master data from seed JSON and merge with Excel diseases."""
    diseases_json = transform_diseases()
    existing_names = {d["name"].lower() for d in diseases_json}
    
    for ed in excel_diseases:
        name = str(ed.get("name", "")).strip()
        if not name:
            continue
        if name.lower() not in existing_names:
            code = DISEASE_NAME_TO_CODE.get(name) or name.lower().replace(" ", "_")
            diseases_json.append({
                "_id": ObjectId(),
                "code": code,
                "name": name,
                "created_at": datetime.now(timezone.utc)
            })
            existing_names.add(name.lower())
    logger.info("Combined master diseases list has %d records", len(diseases_json))
    return diseases_json


# ── TRANSFORM: Detection Results ─────────────────────────────────────

def transform_detection_results(
    rows: List[Dict[str, Any]],
    inspection_map: Dict[str, ObjectId],
    stats: ETLStats,
) -> List[Dict[str, Any]]:
    """Transform detection results from Excel rows."""
    results = []
    for r in rows:
        insp_code = str(r.get("inspection_code", "")).strip()
        insp_oid = inspection_map.get(insp_code)
        if not insp_oid:
            stats.orphan_inspections += 1
            continue
            
        confidence = parse_float(str(r.get("confidence", ""))) or 0.0
        
        results.append({
            "_id": ObjectId(),
            "inspection_id": insp_oid,
            "model": str(r.get("model", "")).strip(),
            "prediction": str(r.get("prediction", "")).strip(),
            "confidence": confidence,
            "created_at": datetime.now(timezone.utc),
        })
    logger.info("Transformed %d detection results", len(results))
    return results


# ── TRANSFORM: Disease History ───────────────────────────────────────

def transform_disease_history(
    rows: List[Dict[str, Any]],
    tree_map: Dict[str, ObjectId],
    stats: ETLStats,
) -> List[Dict[str, Any]]:
    """Transform disease history from Excel rows."""
    history = []
    for r in rows:
        tree_code = str(r.get("tree_code", "")).strip()
        tree_oid = tree_map.get(tree_code)
        if not tree_oid:
            stats.orphan_trees += 1
            continue
            
        dt = parse_date(str(r.get("date", "")))
        if not dt:
            stats.invalid_dates += 1
            continue
            
        history.append({
            "_id": ObjectId(),
            "tree_id": tree_oid,
            "disease": str(r.get("disease", "")).strip(),
            "date": dt,
            "action": str(r.get("action", "")).strip(),
            "created_at": datetime.now(timezone.utc),
        })
    logger.info("Transformed %d disease history records", len(history))
    return history


# ── TRANSFORM: Alerts ────────────────────────────────────────────────

def transform_alerts(
    rows: List[Dict[str, Any]],
    farm_map: Dict[str, ObjectId],
    tree_map: Dict[str, ObjectId],
    stats: ETLStats,
) -> List[Dict[str, Any]]:
    """Transform alerts from Excel rows."""
    alerts = []
    for r in rows:
        farm_code = str(r.get("farm_code", "")).strip()
        tree_code = str(r.get("tree_code", "")).strip()
        
        farm_oid = farm_map.get(farm_code)
        tree_oid = tree_map.get(tree_code)
        
        if not farm_oid:
            stats.orphan_farms += 1
            continue
        if not tree_oid:
            stats.orphan_trees += 1
            continue
            
        dt = parse_date(str(r.get("date", "")))
        if not dt:
            stats.invalid_dates += 1
            continue
            
        alerts.append({
            "_id": ObjectId(),
            "farm_id": farm_oid,
            "tree_id": tree_oid,
            "alert_type": str(r.get("alert_type", "")).strip(),
            "priority": str(r.get("priority", "")).strip(),
            "date": dt,
            "created_at": datetime.now(timezone.utc),
        })
    logger.info("Transformed %d alerts", len(alerts))
    return alerts


# ── LOAD: Users ──────────────────────────────────────────────────────

def load_users(db: Database, users: List[Dict[str, Any]], stats: ETLStats) -> None:
    """Insert users into MongoDB."""
    if not users:
        return
    try:
        result = db.users.insert_many(users, ordered=False)
        stats.users_loaded = len(result.inserted_ids)
    except DuplicateKeyError:
        count = 0
        for u in users:
            try:
                db.users.insert_one(u)
                count += 1
            except DuplicateKeyError:
                stats.users_removed_duplicates += 1
        stats.users_loaded = count
    logger.info("Inserted %d users (%d duplicates skipped)",
                 stats.users_loaded, stats.users_removed_duplicates)


# ── LOAD: Detection Results ──────────────────────────────────────────

def load_detection_results(db: Database, results: List[Dict[str, Any]], stats: ETLStats) -> None:
    """Insert detection results into MongoDB."""
    if not results:
        return
    try:
        result = db.detection_results.insert_many(results, ordered=False)
        stats.detection_results_loaded = len(result.inserted_ids)
    except DuplicateKeyError:
        count = 0
        for r in results:
            try:
                db.detection_results.insert_one(r)
                count += 1
            except DuplicateKeyError:
                stats.detection_results_removed_duplicates += 1
        stats.detection_results_loaded = count
    logger.info("Inserted %d detection results (%d duplicates skipped)",
                 stats.detection_results_loaded, stats.detection_results_removed_duplicates)


# ── LOAD: Disease History ────────────────────────────────────────────

def load_disease_history(db: Database, history: List[Dict[str, Any]], stats: ETLStats) -> None:
    """Insert disease history into MongoDB."""
    if not history:
        return
    try:
        result = db.disease_history.insert_many(history, ordered=False)
        stats.disease_history_loaded = len(result.inserted_ids)
    except DuplicateKeyError:
        count = 0
        for h in history:
            try:
                db.disease_history.insert_one(h)
                count += 1
            except DuplicateKeyError:
                stats.disease_history_removed_duplicates += 1
        stats.disease_history_loaded = count
    logger.info("Inserted %d disease history records (%d duplicates skipped)",
                 stats.disease_history_loaded, stats.disease_history_removed_duplicates)


# ── LOAD: Alerts ─────────────────────────────────────────────────────

def load_alerts(db: Database, alerts: List[Dict[str, Any]], stats: ETLStats) -> None:
    """Insert alerts into MongoDB."""
    if not alerts:
        return
    try:
        result = db.alerts.insert_many(alerts, ordered=False)
        stats.alerts_loaded = len(result.inserted_ids)
    except DuplicateKeyError:
        count = 0
        for a in alerts:
            try:
                db.alerts.insert_one(a)
                count += 1
            except DuplicateKeyError:
                stats.alerts_removed_duplicates += 1
        stats.alerts_loaded = count
    logger.info("Inserted %d alerts (%d duplicates skipped)",
                 stats.alerts_loaded, stats.alerts_removed_duplicates)


# ── TRANSFORM: Inspections ───────────────────────────────────────────

def transform_inspections(
    inspections_df: pd.DataFrame,
    tree_map: Dict[str, ObjectId],
    disease_map: Dict[str, ObjectId],
    stats: ETLStats,
) -> List[Dict[str, Any]]:
    """Transform inspections from the Excel inspections sheet directly."""
    inspections = []

    for _, row in inspections_df.iterrows():
        tree_code = str(row.get("tree_code", "")).strip()
        tree_oid = tree_map.get(tree_code)
        if not tree_oid:
            stats.orphan_inspections += 1
            continue

        insp_date = parse_date(str(row.get("inspection_date", "")))
        if not insp_date:
            stats.invalid_dates += 1
            continue

        raw_disease = str(row.get("predicted_disease", "")).strip()
        disease_code = DISEASE_NAME_TO_CODE.get(raw_disease, "healthy")
        disease_oid = disease_map.get(disease_code)

        confidence = parse_float(str(row.get("confidence", ""))) or 0.0
        temperature = parse_float(str(row.get("temperature", "")))
        humidity = parse_float(str(row.get("humidity", "")))
        rainfall = parse_float(str(row.get("rainfall", "")))

        health_status = str(row.get("health_status", "")).strip()

        inspections.append({
            "_id": ObjectId(),
            "inspection_code": str(row.get("inspection_code", "")).strip(),
            "farm_id": None,  # filled during load
            "zone_id": None,  # filled during load
            "tree_id": tree_oid,
            "disease_id": disease_oid,
            "inspection_date": insp_date,
            "temperature": temperature,
            "humidity": humidity,
            "rainfall_mm": rainfall,
            "wind_speed": None,
            "confidence": confidence,
            "predicted_disease": raw_disease,
            "health_status": health_status,
            "severity": None,
            "remark": None,
            "created_at": datetime.now(timezone.utc),
        })

    logger.info("Transformed %d inspection records from %d Excel rows",
                len(inspections), len(inspections_df))
    return inspections


# ── LOAD: Create Collections & Indexes ───────────────────────────────

def create_collections_and_indexes(
    db: Database,
    drop_existing: bool = False,
) -> ETLStats:
    """Create all 10 collections with validators and indexes."""
    stats = ETLStats()

    for coll_name in Collections.all():
        try:
            exists = coll_name in db.list_collection_names()
            if drop_existing and exists:
                db.drop_collection(coll_name)
                logger.info("Dropped collection: %s", coll_name)
                exists = False

            schema = get_collection_validators().get(coll_name, {})
            if exists and schema:
                db.command(
                    "collMod",
                    coll_name,
                    validator=schema,
                    validationLevel="strict",
                    validationAction="error",
                )
                logger.info("Updated validator: %s", coll_name)
            elif schema:
                db.create_collection(
                    coll_name,
                    validator=schema,
                    validationLevel="strict",
                    validationAction="error",
                )
                logger.info("Created collection: %s", coll_name)
            elif not exists:
                db.create_collection(coll_name)
                logger.info("Created collection (no validator): %s", coll_name)

        except OperationFailure as exc:
            stats.add_error(f"Failed to create/update '{coll_name}': {exc}")

    # Indexes
    for coll_name, specs in get_index_specs().items():
        if coll_name not in db.list_collection_names():
            continue
        collection: Collection = db[coll_name]
        existing = collection.index_information()
        for spec in specs:
            try:
                name = spec.get("name", "unnamed")
                if name in existing:
                    continue
                keys = spec.pop("keys")
                collection.create_index(keys, **spec)
            except OperationFailure as exc:
                stats.add_error(
                    f"Failed to create index '{spec.get('name', 'unnamed')}' "
                    f"on '{coll_name}': {exc}"
                )

    return stats


# ── LOAD: Insert Documents ───────────────────────────────────────────

def load_documents(
    db: Database,
    companies: List[Dict],
    farms: List[Dict],
    zones: List[Dict],
    trees: List[Dict],
    diseases: List[Dict],
    inspections: List[Dict],
    users: List[Dict],
    detection_results: List[Dict],
    disease_history: List[Dict],
    alerts: List[Dict],
    stats: ETLStats,
) -> None:
    # Check if any collection already contains documents
    for coll_name in Collections.all():
        if db[coll_name].count_documents({}) > 0:
            raise Exception(
                "The database already contains data.\n"
                "ETL import is allowed only on an empty database."
            )

    def clean_doc(d):
        cleaned = {}
        for k, v in d.items():
            if v is None:
                continue
            if isinstance(v, float) and math.isnan(v):
                continue
            if k == "rainfall_mm":
                cleaned["rainfall"] = v
            else:
                cleaned[k] = v
        return cleaned

    companies = [clean_doc(c) for c in companies]
    farms = [clean_doc(f) for f in farms]
    zones = [clean_doc(z) for z in zones]
    trees = [clean_doc(t) for t in trees]
    diseases = [clean_doc(d) for d in diseases]
    inspections = [clean_doc(i) for i in inspections]
    users = [clean_doc(u) for u in users]
    detection_results = [clean_doc(dr) for dr in detection_results]
    disease_history = [clean_doc(dh) for dh in disease_history]
    alerts = [clean_doc(al) for al in alerts]

    # Build lookup maps
    company_by_name: Dict[str, Any] = {}
    for c in companies:
        company_by_name[c["company_name"]] = c

    farm_by_code: Dict[str, Any] = {}
    for f in farms:
        farm_by_code[f["farm_code"]] = f

    zone_by_code: Dict[str, Any] = {}
    for z in zones:
        zone_by_code[z["zone_code"]] = z

    # ── 1. Insert companies ──────────────────────────────────────────
    try:
        result = db.companies.insert_many(companies, ordered=False)
        stats.companies_loaded = len(result.inserted_ids)
        logger.info("Inserted %d companies", stats.companies_loaded)
    except DuplicateKeyError:
        # Fall back to individual inserts
        count = 0
        for c in companies:
            try:
                db.companies.insert_one(c)
                count += 1
            except DuplicateKeyError:
                stats.companies_removed_duplicates += 1
        stats.companies_loaded = count
        logger.info("Inserted %d companies (%d duplicates skipped)",
                     count, stats.companies_removed_duplicates)

    # ── 2. Insert farms ──────────────────────────────────────────────
    try:
        result = db.farms.insert_many(farms, ordered=False)
        stats.farms_loaded = len(result.inserted_ids)
        logger.info("Inserted %d farms", stats.farms_loaded)
    except DuplicateKeyError:
        count = 0
        for f in farms:
            try:
                db.farms.insert_one(f)
                count += 1
            except DuplicateKeyError:
                stats.farms_removed_duplicates += 1
        stats.farms_loaded = count
        logger.info("Inserted %d farms (%d duplicates skipped)",
                     count, stats.farms_removed_duplicates)

    # ── 3. Insert zones ──────────────────────────────────────────────
    try:
        result = db.zones.insert_many(zones, ordered=False)
        stats.zones_loaded = len(result.inserted_ids)
        logger.info("Inserted %d zones", stats.zones_loaded)
    except DuplicateKeyError:
        count = 0
        for z in zones:
            try:
                db.zones.insert_one(z)
                count += 1
            except DuplicateKeyError:
                stats.zones_removed_duplicates += 1
        stats.zones_loaded = count
        logger.info("Inserted %d zones (%d duplicates skipped)",
                     count, stats.zones_removed_duplicates)

    # ── 4. Insert diseases ───────────────────────────────────────────
    try:
        result = db.diseases.insert_many(diseases, ordered=False)
        stats.diseases_loaded = len(result.inserted_ids)
        logger.info("Inserted %d diseases", stats.diseases_loaded)
    except DuplicateKeyError:
        count = 0
        for d in diseases:
            try:
                db.diseases.insert_one(d)
                count += 1
            except DuplicateKeyError:
                pass
        stats.diseases_loaded = count
        logger.info("Inserted %d diseases", stats.diseases_loaded)

    # ── 5. Insert trees ──────────────────────────────────────────────
    # Reload farm and zone maps from DB for accurate _id references
    reloaded_farms = {f["farm_code"]: f for f in db.farms.find()}
    reloaded_zones = {z["zone_code"]: z for z in db.zones.find()}
    reloaded_diseases = {d["code"]: d for d in db.diseases.find()}

    # Update tree references
    for tree in trees:
        farm_code = None
        for fc, fdoc in reloaded_farms.items():
            if fdoc["_id"] == tree["farm_id"]:
                farm_code = fc
                break
        if farm_code:
            # Build expected zone code
            zone_name_from_db = None
            for zc, zdoc in reloaded_zones.items():
                if zdoc["_id"] == tree.get("zone_id"):
                    zone_name_from_db = zc
                    break

    # Re-transform trees with correct OIDs
    final_trees = []
    tree_map: Dict[Tuple[str, str], ObjectId] = {}
    for tree in trees:
        # Actually we need to process differently: tree["farm_id"] is already an OID
        # and tree["zone_id"] is already an OID from transform_trees
        # Just insert and build lookup map
        final_trees.append(tree)

    try:
        result = db.trees.insert_many(final_trees, ordered=False)
        stats.trees_loaded = len(result.inserted_ids)
    except DuplicateKeyError:
        count = 0
        for t in final_trees:
            try:
                db.trees.insert_one(t)
                count += 1
            except DuplicateKeyError:
                stats.trees_removed_duplicates += 1
        stats.trees_loaded = count
    logger.info("Inserted %d trees (%d duplicates skipped)",
                 stats.trees_loaded, stats.trees_removed_duplicates)

    # Build tree_map from actual DB documents
    for tdoc in db.trees.find():
        # Get farm_code from farms collection via farm_id
        farm_doc = db.farms.find_one({"_id": tdoc["farm_id"]})
        if farm_doc:
            tree_map[(farm_doc["farm_code"], tdoc["tree_code"])] = tdoc["_id"]

    # ── 6. Inspections: fix references and insert ────────────────────
    final_inspections = []
    for insp in inspections:
        # Find tree_id in tree_map
        # We need to look up the tree_key for this inspection
        # The tree_key was (farm_id_str, tree_code) during transform
        # Since we lost that info, we need to derive it from what we have
        tree_doc = db.trees.find_one({"_id": insp["tree_id"]})
        if not tree_doc:
            stats.orphan_inspections += 1
            continue

        farm_doc = db.farms.find_one({"_id": tree_doc["farm_id"]})
        if not farm_doc:
            stats.orphan_inspections += 1
            continue

        insp["farm_id"] = tree_doc["farm_id"]

        # zone_id from tree
        zone_oid = tree_doc.get("zone_id")
        insp["zone_id"] = zone_oid

        final_inspections.append(insp)

    if final_inspections:
        try:
            result = db.inspections.insert_many(final_inspections, ordered=False)
            stats.inspections_loaded = len(result.inserted_ids)
        except DuplicateKeyError:
            count = 0
            for ins in final_inspections:
                try:
                    db.inspections.insert_one(ins)
                    count += 1
                except DuplicateKeyError:
                    stats.inspections_removed_duplicates += 1
            stats.inspections_loaded = count
    logger.info("Inserted %d inspections (%d duplicates skipped)",
                 stats.inspections_loaded, stats.inspections_removed_duplicates)

    # ── 7. Insert users ──────────────────────────────────────────────
    load_users(db, users, stats)

    # ── 8. Insert detection results ──────────────────────────────────
    load_detection_results(db, detection_results, stats)

    # ── 9. Insert disease history ────────────────────────────────────
    load_disease_history(db, disease_history, stats)

    # ── 10. Insert alerts ────────────────────────────────────────────
    load_alerts(db, alerts, stats)


# ── MAIN ETL ─────────────────────────────────────────────────────────

def run_etl(
    drop_existing: bool = False,
    dry_run: bool = False,
    verbose: bool = False,
) -> ETLStats:
    """Execute the full ETL pipeline."""
    _setup_logging(verbose)
    stats = ETLStats()

    logger.info("=" * 60)
    logger.info("  DURIAN GUARDIAN AI - ETL Pipeline")
    logger.info("=" * 60)

    # ── EXTRACT ──────────────────────────────────────────────────────
    logger.info("")
    logger.info(">>> EXTRACT")
    rows = extract_excel()
    stats.csv_rows = len(rows)

    excel_path = "D:\\data\\DGA_Enterprise_Dataset.xlsx"
    logger.info("Reading additional sheets from Excel: %s", excel_path)
    xls = pd.ExcelFile(excel_path)

    # Helper function to read a sheet and convert to a list of dicts with stripped strings
    def read_sheet_clean(sheet_name: str) -> List[Dict[str, Any]]:
        df = pd.read_excel(xls, sheet_name=sheet_name)
        for col in df.columns:
            if df[col].dtype == object:
                df[col] = df[col].astype(str).str.strip()
        return [row.to_dict() for _, row in df.iterrows()]

    users_rows = read_sheet_clean("users")
    diseases_rows = read_sheet_clean("diseases")
    det_rows = read_sheet_clean("detection_results")
    his_rows = read_sheet_clean("disease_history")
    alerts_rows = read_sheet_clean("alerts")

    # ── TRANSFORM ────────────────────────────────────────────────────
    logger.info("")
    logger.info(">>> TRANSFORM")

    # Companies
    logger.info("  Normalizing companies...")
    companies = transform_companies(rows.companies_df)
    company_by_name = {c["company_name"]: c for c in companies}

    # Farms
    logger.info("  Normalizing farms...")
    company_map = {c["company_code"]: c["_id"] for c in companies}
    farms = transform_farms(rows.farms_df, company_map)
    farm_by_code = {f["farm_code"]: f for f in farms}

    # Zones
    logger.info("  Normalizing zones...")
    farm_map = {f["farm_code"]: f["_id"] for f in farms}
    zones = transform_zones(rows.zones_df, farm_map)
    zone_by_code = {z["zone_code"]: z for z in zones}

    # Users
    logger.info("  Normalizing users...")
    users = transform_users(users_rows)

    # Trees
    logger.info("  Normalizing trees...")
    zone_map = {}
    for z in zones:
        zone_map[z["zone_code"]] = z["_id"]
    trees = transform_trees(rows.trees_df, rows.inspections_df, farm_map, zone_map, stats)
    tree_lookup_by_code = {t["tree_code"]: t["_id"] for t in trees}

    # Diseases
    logger.info("  Loading disease master data...")
    diseases = transform_diseases_combined(diseases_rows)
    disease_by_code = {d["code"]: d for d in diseases}

    # Inspections
    logger.info("  Normalizing inspections...")
    disease_lookup = {d["code"]: d["_id"] for d in diseases}

    inspections = transform_inspections(
        rows.inspections_df, tree_lookup_by_code, disease_lookup, stats
    )

    # Fix farm_id and zone_id for inspections
    for insp in inspections:
        tree_doc = next(
            (t for t in trees if t["_id"] == insp["tree_id"]), None
        )
        if tree_doc:
            insp["farm_id"] = tree_doc["farm_id"]
            insp["zone_id"] = tree_doc.get("zone_id")

    # Detection Results
    logger.info("  Normalizing detection results...")
    inspection_lookup = {insp["inspection_code"]: insp["_id"] for insp in inspections}
    detection_results = transform_detection_results(det_rows, inspection_lookup, stats)

    # Disease History
    logger.info("  Normalizing disease history...")
    disease_history = transform_disease_history(his_rows, tree_lookup_by_code, stats)

    # Alerts
    logger.info("  Normalizing alerts...")
    alerts = transform_alerts(alerts_rows, farm_map, tree_lookup_by_code, stats)

    if dry_run:
        logger.info("")
        logger.info(">>> DRY RUN - Summary")
        logger.info("  Companies         : %d", len(companies))
        logger.info("  Farms             : %d", len(farms))
        logger.info("  Zones             : %d", len(zones))
        logger.info("  Users             : %d", len(users))
        logger.info("  Trees             : %d", len(trees))
        logger.info("  Diseases          : %d", len(diseases))
        logger.info("  Inspections       : %d", len(inspections))
        logger.info("  Detection Results : %d", len(detection_results))
        logger.info("  Disease History   : %d", len(disease_history))
        logger.info("  Alerts            : %d", len(alerts))
        return stats

    # ── LOAD ─────────────────────────────────────────────────────────
    logger.info("")
    logger.info(">>> LOAD")

    # Connect
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
        # Create collections and indexes first
        logger.info("  Creating collections and indexes...")
        coll_stats = create_collections_and_indexes(db, drop_existing)
        stats.errors.extend(coll_stats.errors)

        # Load documents
        logger.info("  Inserting documents...")
        load_documents(
            db, companies, farms, zones, trees, diseases, inspections,
            users, detection_results, disease_history, alerts, stats
        )

        # ── VALIDATION ───────────────────────────────────────────────
        logger.info("")
        logger.info(">>> VALIDATION")

        # Count documents
        doc_counts = {}
        for coll_name in Collections.all():
            count = db[coll_name].count_documents({})
            doc_counts[coll_name] = count
            logger.info("  %-20s : %d docs", coll_name, count)

        # Check references
        logger.info("")
        logger.info("  Reference integrity checks:")

        # Farms -> Companies
        orphan_farms = 0
        for f in db.farms.find({"company_id": {"$exists": True}}):
            if not db.companies.find_one({"_id": f["company_id"]}):
                orphan_farms += 1
        stats.orphan_farms = orphan_farms
        logger.info("  Orphan farms (no company): %d", orphan_farms)

        # Zones -> Farms
        orphan_zones = 0
        for z in db.zones.find({"farm_id": {"$exists": True}}):
            if not db.farms.find_one({"_id": z["farm_id"]}):
                orphan_zones += 1
        stats.orphan_zones = orphan_zones
        logger.info("  Orphan zones (no farm): %d", orphan_zones)

        # Trees -> Farms, Zones
        orphan_trees_farm = 0
        orphan_trees_zone = 0
        for t in db.trees.find():
            if not db.farms.find_one({"_id": t["farm_id"]}):
                orphan_trees_farm += 1
            if t.get("zone_id") and not db.zones.find_one({"_id": t["zone_id"]}):
                orphan_trees_zone += 1
        stats.orphan_trees = orphan_trees_farm + orphan_trees_zone
        logger.info("  Orphan trees (no farm): %d", orphan_trees_farm)
        logger.info("  Orphan trees (no zone): %d", orphan_trees_zone)

        # Inspections -> Trees, Diseases
        orphan_insp_tree = 0
        orphan_insp_disease = 0
        for ins in db.inspections.find():
            if not db.trees.find_one({"_id": ins["tree_id"]}):
                orphan_insp_tree += 1
            if ins.get("disease_id") and not db.diseases.find_one(
                {"_id": ins["disease_id"]}
            ):
                orphan_insp_disease += 1
        stats.orphan_inspections = orphan_insp_tree + orphan_insp_disease
        logger.info("  Orphan inspections (no tree): %d", orphan_insp_tree)
        logger.info("  Orphan inspections (no disease): %d", orphan_insp_disease)

        # Detection Results -> Inspections
        orphan_detections = 0
        for dr in db.detection_results.find():
            if not db.inspections.find_one({"_id": dr["inspection_id"]}):
                orphan_detections += 1
        logger.info("  Orphan detection results (no inspection): %d", orphan_detections)

        # Disease History -> Trees
        orphan_history = 0
        for dh in db.disease_history.find():
            if not db.trees.find_one({"_id": dh["tree_id"]}):
                orphan_history += 1
        logger.info("  Orphan disease history (no tree): %d", orphan_history)

        # Alerts -> Farms, Trees
        orphan_alerts_farm = 0
        orphan_alerts_tree = 0
        for al in db.alerts.find():
            if not db.farms.find_one({"_id": al["farm_id"]}):
                orphan_alerts_farm += 1
            if not db.trees.find_one({"_id": al["tree_id"]}):
                orphan_alerts_tree += 1
        logger.info("  Orphan alerts (no farm): %d", orphan_alerts_farm)
        logger.info("  Orphan alerts (no tree): %d", orphan_alerts_tree)

    except Exception as exc:
        logger.critical("ETL failed: %s", exc)
        stats.add_error(str(exc))
        raise
    finally:
        client.close()
        logger.info("MongoDB connection closed.")

    return stats


# ── PRINT SUMMARY ────────────────────────────────────────────────────

def print_summary(stats: ETLStats) -> None:
    logger.info("")
    logger.info("=" * 60)
    logger.info("  ETL COMPLETE - Database Summary")
    logger.info("=" * 60)
    logger.info("  Imported documents:")
    logger.info("    Companies         : %d", stats.companies_loaded)
    logger.info("    Farms             : %d", stats.farms_loaded)
    logger.info("    Zones             : %d", stats.zones_loaded)
    logger.info("    Users             : %d", stats.users_loaded)
    logger.info("    Trees             : %d", stats.trees_loaded)
    logger.info("    Diseases          : %d", stats.diseases_loaded)
    logger.info("    Inspections       : %d", stats.inspections_loaded)
    logger.info("    Detection Results : %d", stats.detection_results_loaded)
    logger.info("    Disease History   : %d", stats.disease_history_loaded)
    logger.info("    Alerts            : %d", stats.alerts_loaded)
    logger.info("")
    logger.info("  Duplicates removed:")
    logger.info("    Companies         : %d", stats.companies_removed_duplicates)
    logger.info("    Farms             : %d", stats.farms_removed_duplicates)
    logger.info("    Zones             : %d", stats.zones_removed_duplicates)
    logger.info("    Users             : %d", stats.users_removed_duplicates)
    logger.info("    Trees             : %d", stats.trees_removed_duplicates)
    logger.info("    Inspections       : %d", stats.inspections_removed_duplicates)
    logger.info("    Detection Results : %d", stats.detection_results_removed_duplicates)
    logger.info("    Disease History   : %d", stats.disease_history_removed_duplicates)
    logger.info("    Alerts            : %d", stats.alerts_removed_duplicates)
    logger.info("")
    logger.info("  Relationships:")
    logger.info("    Orphan farms      : %d", stats.orphan_farms)
    logger.info("    Orphan zones      : %d", stats.orphan_zones)
    logger.info("    Orphan trees      : %d", stats.orphan_trees)
    logger.info("    Orphan inspections: %d", stats.orphan_inspections)
    logger.info("")
    logger.info("  Data quality:")
    logger.info("    Invalid dates     : %d", stats.invalid_dates)
    logger.info("")
    if stats.errors:
        logger.info("  Errors (%d):", len(stats.errors))
        for err in stats.errors:
            logger.info("    - %s", err)
    else:
        logger.info("  Errors            : 0")
    logger.info("")
    logger.info("  Status: %s", "SUCCESS" if not stats.errors else "FAILED")
    logger.info("=" * 60)


# ── CLI ──────────────────────────────────────────────────────────────

def parse_args(argv: Optional[List[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Durian Guardian AI - ETL Pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Examples:\n"
            "  python -m database.etl_pipeline\n"
            "  python -m database.etl_pipeline --drop-existing\n"
            "  python -m database.etl_pipeline --dry-run\n"
            "  python -m database.etl_pipeline --verbose\n"
        ),
    )
    parser.add_argument(
        "--drop-existing",
        action="store_true",
        help="Drop all collections before re-creating",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Transform only, do not insert into MongoDB",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable debug logging",
    )
    return parser.parse_args(argv)


def main() -> None:
    args = parse_args()
    stats = run_etl(
        drop_existing=args.drop_existing,
        dry_run=args.dry_run,
        verbose=args.verbose,
    )
    print_summary(stats)
    if stats.errors:
        sys.exit(1)


if __name__ == "__main__":
    main()
