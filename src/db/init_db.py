"""Initialize the database for AURA (SQLite or Postgres) via SQLAlchemy.

Creates `jobs`, `ratings`, and `outcomes` if they do not exist.
Use Alembic for schema evolution beyond the initial creation.
"""

from __future__ import annotations

import logging
from pathlib import Path

from .models import Base
from .session import engine, get_database_url
from ..logging_config import setup_logging


def init_sqlite(db_path: Path) -> None:  # backwards compatibility signature
    # Ensure parent dir exists when using SQLite
    db_path.parent.mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=engine)


def main() -> int:
    setup_logging()
    log = logging.getLogger("aura.db.init")
    url = get_database_url()
    # Create parent dir for SQLite
    if url.startswith("sqlite"):
        p = Path(url.split("sqlite:///")[-1])
        p.parent.mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=engine)
    print(f"Initialized DB (URL): {url}")
    log.info("Initialized DB (URL): %s", url)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
