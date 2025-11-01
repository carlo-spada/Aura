"""Weekly cycle runner for AURA.

Steps:
1) Ensure DB exists
2) Ingest new jobs (last 7 days)
3) Embed missing jobs
4) Rebuild FAISS index

Extend later with ranking, feedback prompts, training, metrics, etc.
"""

from __future__ import annotations

import logging
from pathlib import Path

from ..config import load_config
from ..db.init_db import init_sqlite
from ..embeddings.encoder import build_faiss_index, embed_missing
from ..ingestion.remoteok import run as ingest_remoteok
from ..logging_config import setup_logging


def main() -> int:
    setup_logging()
    log = logging.getLogger("aura.pipeline.weekly")
    cfg = load_config()

    data_dir = Path(cfg["paths"]["data_dir"]) 
    db_path = data_dir / "jobs.db"
    init_sqlite(db_path)
    log.info("Starting weekly pipeline. DB: %s", db_path)

    # 1) Ingestion (last 7 days)
    try:
        ingest_remoteok(days=7)
    except Exception as e:
        log.exception("Ingestion failed: %s", e)
        return 2

    # 2) Embeddings
    try:
        embed_missing()
    except Exception as e:
        log.exception("Embedding failed: %s", e)
        return 3

    # 3) Index
    try:
        build_faiss_index()
    except Exception as e:
        log.exception("Indexing failed: %s", e)
        return 4

    log.info("Weekly pipeline complete.")
    print("Weekly pipeline complete.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

