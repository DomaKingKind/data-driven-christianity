#!/usr/bin/env python3
"""
Build the Data-Driven Christianity Database from Free Sources
=============================================================

This script builds bible.db from scratch using only free, public-domain data:

  1. STEP Bible morphological data (CC BY 4.0) — github.com/STEPBible/STEPBible-Data
  2. Berean Standard Bible text (Public Domain) — bereanbible.com
  3. OpenBible.info cross-references (CC BY) — openbible.info/labs/cross-references
  4. Other public-domain translations: KJV, ASV, YLT, BBE

After building the base database, run 01_gpu_embeddings.py to add the vector embeddings.

Requirements:
    pip install requests tqdm --break-system-packages

Usage:
    python build_database.py                    # Downloads sources + builds DB
    python build_database.py --skip-download    # Uses already-downloaded sources
"""

import sqlite3
import os
import re
import sys
import csv
import zipfile
import io
from pathlib import Path
from collections import defaultdict

# Try importing optional deps
try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False

try:
    from tqdm import tqdm
except ImportError:
    def tqdm(it, **kw):
        return it

# ── Configuration ─────────────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR / "source_data"
DB_PATH = SCRIPT_DIR / "bible.db"

STEPBIBLE_REPO = "https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master"
TAHOT_FILES = [
    "Translators%20Amalgamated%20OT%2BNT/TAHOT%20Gen-Deu%20-%20Translators%20Amalgamated%20Hebrew%20OT%20-%20STEPBible.org%20CC%20BY.txt",
    "Translators%20Amalgamated%20OT%2BNT/TAHOT%20Jos-Est%20-%20Translators%20Amalgamated%20Hebrew%20OT%20-%20STEPBible.org%20CC%20BY.txt",
    "Translators%20Amalgamated%20OT%2BNT/TAHOT%20Job-Sng%20-%20Translators%20Amalgamated%20Hebrew%20OT%20-%20STEPBible.org%20CC%20BY.txt",
    "Translators%20Amalgamated%20OT%2BNT/TAHOT%20Isa-Mal%20-%20Translators%20Amalgamated%20Hebrew%20OT%20-%20STEPBible.org%20CC%20BY.txt",
]
TAGNT_FILES = [
    "Translators%20Amalgamated%20OT%2BNT/TAGNT%20Gen-DeuTent%20-%20Translators%20Amalgamated%20Greek%20NT%20-%20STEPBible.org%20CC%20BY.txt",]

