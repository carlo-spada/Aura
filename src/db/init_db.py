"""Initialize the local SQLite database for AURA.

Creates `jobs`, `ratings`, and `outcomes` tables if they do not exist.
Run this once after setting up the environment.
"""

from __future__ import annotations

import sqlite3
from pathlib import Path

import logging

from ..config import load_config
from ..logging_config import setup_logging


SCHEMA_SQL = """
PRAGMA journal_mode=WAL;

CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY,
    title TEXT,
    company TEXT,
    location TEXT,
    salary_min REAL,
    salary_max REAL,
    currency TEXT,
    description TEXT,
    url TEXT,
    date_posted DATE,
    embedding BLOB
);

CREATE TABLE IF NOT EXISTS ratings (
    id INTEGER PRIMARY KEY,
    job_id INTEGER,
    fit_score INTEGER,
    interest_score INTEGER,
    prestige_score INTEGER,
    location_score INTEGER,
    comment TEXT,
    timestamp DATETIME,
    FOREIGN KEY(job_id) REFERENCES jobs(id)
);

CREATE TABLE IF NOT EXISTS outcomes (
    id INTEGER PRIMARY KEY,
    job_id INTEGER,
    stage TEXT,
    reward REAL,
    timestamp DATETIME,
    FOREIGN KEY(job_id) REFERENCES jobs(id)
);
"""


def init_sqlite(db_path: Path) -> None:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(db_path) as conn:
        conn.executescript(SCHEMA_SQL)
        conn.commit()


def main() -> int:
    setup_logging()
    log = logging.getLogger("aura.db.init")
    cfg = load_config()
    db_path = Path(cfg["paths"]["data_dir"]) / "jobs.db"
    init_sqlite(db_path)
    print(f"Initialized DB at: {db_path}")
    log.info("Initialized DB at %s", db_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
