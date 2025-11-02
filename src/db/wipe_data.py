"""Drop all data and recreate an empty schema.

Usage:
  python -m src.db.wipe_data         # interactive confirm
  python -m src.db.wipe_data --yes   # no prompt

Notes:
- Works with either Postgres (via DATABASE_URL) or SQLite fallback.
- Also removes FAISS index file at paths.data_dir/faiss.index by default.
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path

from .session import get_database_url, make_engine
from .models import Base
from ..config import load_config


def remove_faiss_index() -> None:
    cfg = load_config()
    idx = Path(cfg["paths"]["data_dir"]) / "faiss.index"
    try:
        if idx.exists():
            idx.unlink()
            print(f"Removed index: {idx}")
    except Exception as e:
        print(f"Warning: could not remove {idx}: {e}")


def wipe(yes: bool = False) -> int:
    db_url = get_database_url()
    print(f"Connecting to: {db_url}")

    if not yes:
        ans = input("This will DROP ALL DATA and recreate an empty schema. Continue? [y/N] ").strip().lower()
        if ans not in {"y", "yes"}:
            print("Aborted.")
            return 1

    # Special-case SQLite file deletion for a truly clean slate
    if db_url.startswith("sqlite"):
        # sqlite:///relative/path or sqlite:////abs/path
        path = db_url.split("sqlite:///")[-1]
        if path:
            p = Path(path)
            try:
                if p.exists():
                    p.unlink()
                    print(f"Removed SQLite file: {p}")
            except Exception as e:
                print(f"Warning: could not remove SQLite file {p}: {e}")
        # Recreate schema
        engine = make_engine()
        Base.metadata.create_all(bind=engine)
        remove_faiss_index()
        print("Schema recreated (SQLite).")
        return 0

    # Generic path: drop all tables and recreate
    engine = make_engine()
    try:
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        print("Dropped all tables and recreated schema.")
    finally:
        engine.dispose()

    remove_faiss_index()
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Wipe all data and recreate schema")
    parser.add_argument("--yes", action="store_true", help="Do not prompt for confirmation")
    args = parser.parse_args(argv)
    return wipe(yes=args.yes)


if __name__ == "__main__":
    raise SystemExit(main())
