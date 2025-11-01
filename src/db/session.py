from __future__ import annotations

import os
from contextlib import contextmanager
from typing import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from ..config import load_config


def get_database_url() -> str:
    url = os.getenv("DATABASE_URL")
    if url:
        return url
    cfg = load_config()
    data_dir = cfg["paths"]["data_dir"]
    return f"sqlite:///{data_dir}/jobs.db"


def make_engine():
    url = get_database_url()
    connect_args = {}
    if url.startswith("sqlite"):  # pragma: no cover
        connect_args = {"check_same_thread": False}
    return create_engine(url, future=True, connect_args=connect_args)


engine = make_engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


@contextmanager
def get_session() -> Iterator:
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

