"""
Seed Package
============

Contains initial seed data for the Durian Guardian AI database.
MVP only includes disease master data.
"""

import os
import json
from typing import List, Dict, Any


SEED_DIR = os.path.dirname(os.path.abspath(__file__))


def load_seed(filename: str) -> List[Dict[str, Any]]:
    """
    Load a seed JSON file and return its contents.

    Args:
        filename: Name of the JSON file (e.g. 'diseases.json').

    Returns:
        List of document dictionaries.
    """
    filepath = os.path.join(SEED_DIR, filename)
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def load_diseases() -> List[Dict[str, Any]]:
    """Load the diseases seed data."""
    return load_seed("diseases.json")
