from __future__ import annotations

import os
from pathlib import Path
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Session


def _default_sqlite_url() -> str:
    # Store sqlite DB under data/ by default; override with AURA_DATA_DIR
    data_dir = Path(os.getenv("AURA_DATA_DIR", str(Path.cwd() / "data")))
    data_dir.mkdir(parents=True, exist_ok=True)
    return f"sqlite:///{(data_dir / 'jobs.db').as_posix()}"


DATABASE_URL = os.getenv("DATABASE_URL") or _default_sqlite_url()


class Base(DeclarativeBase):
    pass


engine = create_engine(
    DATABASE_URL,
    echo=False,
    future=True,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def get_session() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    # Imported locally to avoid circulars
    from . import models  # noqa: F401

    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_db()
    print("Database initialized.")
