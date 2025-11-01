"""One-off migration: copy data from SQLite to the configured DATABASE_URL.

Usage:
  # Ensure Postgres is running and DATABASE_URL points to it
  python -m src.db.migrate_sqlite_to_postgres --sqlite ./data/jobs.db

Notes:
  - Target DB should be empty (no rows in jobs/ratings/outcomes) unless --force.
  - Preserves primary keys so foreign keys remain valid.
  - For Postgres, adjusts sequences to max(id) after insert.
"""

from __future__ import annotations

import argparse
import logging
import os
import sqlite3
from pathlib import Path

from sqlalchemy import text

from .models import Base, Job, Rating, Outcome
from .session import engine, get_session, get_database_url
from ..logging_config import setup_logging


def count_target() -> tuple[int, int, int]:
    with get_session() as session:
        j = session.query(Job).count()
        r = session.query(Rating).count()
        o = session.query(Outcome).count()
    return j, r, o


def ensure_tables() -> None:
    Base.metadata.create_all(bind=engine)


def load_sqlite_rows(sqlite_path: Path):
    conn = sqlite3.connect(str(sqlite_path))
    conn.row_factory = sqlite3.Row
    with conn:
        jobs = conn.execute(
            "SELECT id, title, company, location, salary_min, salary_max, currency, description, url, date_posted, embedding FROM jobs"
        ).fetchall()
        ratings = conn.execute(
            "SELECT id, job_id, fit_score, interest_score, prestige_score, location_score, comment, timestamp FROM ratings"
        ).fetchall()
        outcomes = conn.execute(
            "SELECT id, job_id, stage, reward, timestamp FROM outcomes"
        ).fetchall()
    conn.close()
    return jobs, ratings, outcomes


def set_postgres_sequences() -> None:
    url = get_database_url()
    if not url.startswith("postgres"):
        return
    with engine.begin() as conn:
        # Adjust sequences to max(id)
        for table, idcol in (("jobs", "id"), ("ratings", "id"), ("outcomes", "id")):
            try:
                conn.execute(text(
                    "SELECT setval(pg_get_serial_sequence(:t, :c), COALESCE((SELECT MAX(id) FROM jobs), 1))"
                ), {"t": table, "c": idcol})
            except Exception:
                # In case serial/identity isn't used, ignore
                pass


def migrate(sqlite_path: Path, dry_run: bool = False, force: bool = False) -> None:
    log = logging.getLogger("aura.db.migrate")
    url = get_database_url()
    if not url.startswith("postgres"):
        log.warning("Target DATABASE_URL does not look like Postgres: %s", url)

    ensure_tables()
    tgt_counts = count_target()
    if any(tgt_counts) and not force:
        raise SystemExit(
            f"Target DB is not empty (jobs={tgt_counts[0]}, ratings={tgt_counts[1]}, outcomes={tgt_counts[2]}). Use --force to proceed."
        )

    jobs, ratings, outcomes = load_sqlite_rows(sqlite_path)
    log.info("Loaded from SQLite: jobs=%d ratings=%d outcomes=%d", len(jobs), len(ratings), len(outcomes))

    if dry_run:
        print("DRY RUN: no changes applied")
        return

    with get_session() as session:
        for r in jobs:
            session.add(
                Job(
                    id=int(r["id"]),
                    title=r["title"],
                    company=r["company"],
                    location=r["location"],
                    salary_min=r["salary_min"],
                    salary_max=r["salary_max"],
                    currency=r["currency"],
                    description=r["description"],
                    url=r["url"],
                    date_posted=r["date_posted"],
                    embedding=r["embedding"],
                )
            )
        for r in ratings:
            session.add(
                Rating(
                    id=int(r["id"]),
                    job_id=int(r["job_id"]),
                    fit_score=r["fit_score"],
                    interest_score=r["interest_score"],
                    prestige_score=r["prestige_score"],
                    location_score=r["location_score"],
                    comment=r["comment"],
                    timestamp=r["timestamp"],
                )
            )
        for r in outcomes:
            session.add(
                Outcome(
                    id=int(r["id"]),
                    job_id=int(r["job_id"]),
                    stage=r["stage"],
                    reward=r["reward"],
                    timestamp=r["timestamp"],
                )
            )

    set_postgres_sequences()
    log.info("Migration complete.")
    print("Migration complete.")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Migrate data from SQLite to the configured DB (Postgres)")
    parser.add_argument("--sqlite", default="./data/jobs.db", help="Path to source SQLite DB")
    parser.add_argument("--dry-run", action="store_true", help="Do not write anything; just report counts")
    parser.add_argument("--force", action="store_true", help="Proceed even if target is not empty")
    args = parser.parse_args(argv)

    setup_logging()
    sqlite_path = Path(args.sqlite)
    if not sqlite_path.exists():
        raise SystemExit(f"SQLite DB not found: {sqlite_path}")
    try:
        migrate(sqlite_path, dry_run=bool(args.dry_run), force=bool(args.force))
    except SystemExit as e:
        print(str(e))
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

