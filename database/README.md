# Durian Guardian AI — Database Layer

Production MongoDB database for the **Durian Guardian AI** platform — an AI-powered
durian farm management system with computer vision disease classification.

---

## Requirements

- **Python** 3.10+
- **MongoDB** 6.0+
- **PyMongo** 4.6+

## Installation

```bash
pip install pymongo
```

## Configuration

| Variable | Default | Description |
|---|---|---|
| `MONGODB_URI` | `mongodb://localhost:27017` | MongoDB connection URI |
| `MONGODB_USERNAME` | (empty) | MongoDB username |
| `MONGODB_PASSWORD` | (empty) | MongoDB password |
| `DATABASE_NAME` | `durian_guardian_ai` | Database name |

## Usage

```bash
# Full ETL (create collections, validators, indexes, import all data)
python -m database.setup_database

# Reset and reload
python -m database.setup_database --drop-existing

# Dry run (transform only, no DB write)
python -m database.setup_database --dry-run
```

## Database Structure

### Collections (10)

```
durian_guardian_ai
├── companies           # Farm owner companies (10)
├── farms               # Durian farms / orchards (10)
├── zones               # Zones within farms (50)
├── trees               # Individual durian trees (6340)
├── users               # System user accounts (empty, schema only)
├── diseases            # Disease master data (11)
├── inspections         # AI inspection records (10000)
├── detection_results   # AI detection output logs (empty, schema only)
├── disease_history     # Longitudinal disease records (empty, schema only)
└── alerts              # System-generated alerts (empty, schema only)
```

### Entity Relationships

```
Company
  │
  └── Farm
        │
        ├── Zone
        │     │
        │     └── Tree
        │           │
        │           ├── Inspection ── Disease
        │           │
        │           ├── Detection Result
        │           │
        │           ├── Disease History
        │           │
        │           └── Alert
        │
        └── User (not seeded)
```

## ETL Pipeline

The CSV at `DGA_seed_dataset_10000.csv` is the single source of truth.

| Step | Action |
|---|---|
| **EXTRACT** | Read all 10,000 CSV rows |
| **TRANSFORM** | Normalize duplicates, generate ObjectIds, convert types |
| **LOAD** | Insert into MongoDB with validator checks |

### Normalization

| Entity | CSV rows | After dedup |
|---|---|---|
| Companies | 10,000 | 10 |
| Farms | 10,000 | 10 |
| Zones | 10,000 | 50 |
| Trees | 10,000 | 6,340 |
| Inspections | 10,000 | 10,000 |

### Disease Code Mapping

CSV disease names map to project class folder codes:

| CSV Name | Disease Code |
|---|---|
| Anthracnose | `anthracnose_disease` |
| Canker | `canker_disease` |
| Fruit Rot | `fruit_rot` |
| Mealybug | `mealybug_infestation` |
| Pink Disease | `pink_disease` |
| Sooty Mold | `sooty_mold` |
| Stem Blight | `stem_blight` |
| Stem Cracking Gummosis | `stem_cracking_gummosis` |
| Yellow Leaf | `yellow_leaf` |
| *Thrips* (from training folders) | `thrips_disease` |
| Healthy | `healthy` |

## JSON Schema Validators

All 10 collections have strict `$jsonSchema` validators that match the
exact document structure produced by the ETL pipeline. Schema-only
collections (users, detection_results, disease_history, alerts) have
validators ready for future use.

## Indexes

| Collection | Indexes |
|---|---|
| companies | `company_code` (unique) |
| farms | `farm_code` (unique), `company_id` |
| zones | `zone_code` (unique), `farm_id` |
| trees | `farm_id+tree_code` (unique compound), `farm_id`, `zone_id`, `status` |
| users | `email` (unique) |
| diseases | `code` (unique) |
| inspections | `inspection_code` (unique), `tree_id+date`, `farm_id+date`, `disease_id`, `health_status`, `date`, `confidence` |
| detection_results | `inspection_id`, `tree_id`, `disease_id`, `confidence` |
| disease_history | `tree_id+date`, `disease_id`, `status` |
| alerts | `farm_id+date`, `alert_type`, `severity`, `is_read` |

## Usage Example

```python
from database.mongodb import get_database

db = get_database()

# Inspections for a specific tree
inspections = db.inspections.find(
    {"tree_id": tree_id}
).sort("inspection_date", -1)

# All trees in a zone
trees = db.trees.find({"zone_id": zone_id})

# Company with their farms
company = db.companies.find_one({"company_code": "COMP001"})
farms = db.farms.find({"company_id": company["_id"]})

# Disease lookup
disease = db.diseases.find_one({"code": "anthracnose_disease"})
```

## File Structure

```
database/
├── __init__.py          # Package docstring
├── config.py            # Settings & environment config
├── db_schema.py         # Collection names, validators
├── indexes.py           # Index specifications
├── mongodb.py           # Connection singleton
├── etl_pipeline.py      # ETL: CSV → MongoDB
├── setup_database.py    # CLI entry point
├── README.md
└── seed/
    ├── __init__.py      # Seed loader
    └── diseases.json    # 11 disease master records
```
