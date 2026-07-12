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
    if stats.errors:
        sys.exit(1)


if __name__ == "__main__":
    main()
