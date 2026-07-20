#!/usr/bin/env python3
"""
Database Setup Script
=====================

Durian Guardian AI - MongoDB Database Setup.

Orchestrates:
  1. Full ETL pipeline (CSV → MongoDB)
  2. Collection creation with JSON Schema validation
  3. Index creation
  4. Relationship integrity verification
  5. Admin account seeding

Usage:
    python -m database.setup_database
    python -m database.setup_database --drop-existing
    python -m database.setup_database --dry-run
    python -m database.setup_database --verbose
"""

import argparse
import sys
from typing import List, Optional

from database.etl_pipeline import run_etl, print_summary
from database.seed_admin import seed_admin
from pymongo import MongoClient
from database.config import settings


def parse_args(argv: Optional[List[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Durian Guardian AI - Database Setup",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Examples:\n"
            "  python -m database.setup_database\n"
            "  python -m database.setup_database --drop-existing\n"
            "  python -m database.setup_database --dry-run\n"
            "  python -m database.setup_database --verbose\n"
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

    # Seed admin account after ETL completes (unless dry-run)
    if not args.dry_run and not stats.errors:
        try:
            client = MongoClient(
                settings.mongodb_uri_with_credentials,
                **settings.connection_kwargs,
            )
            client.admin.command("ping")
            db = client[settings.DATABASE_NAME]
            seed_admin(db)
            client.close()
        except Exception as exc:
            print(f"Warning: Admin seed failed: {exc}", file=sys.stderr)

    if stats.errors:
        sys.exit(1)


if __name__ == "__main__":
    main()
