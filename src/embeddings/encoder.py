"""Sentence-transformers encoder and FAISS index builder for AURA.

CLI usage examples:
  # Embed all jobs with missing embeddings
  python -m src.embeddings.encoder embed

  # Build FAISS index from all embedded jobs
  python -m src.embeddings.encoder index --path data/faiss.index
"""

from __future__ import annotations

import argparse
import io
import logging
import os
import sqlite3
from pathlib import Path
from typing import Iterable, List, Optional, Sequence, Tuple

import faiss  # type: ignore
import numpy as np
from sentence_transformers import SentenceTransformer

from ..config import load_config
from ..db.init_db import init_sqlite
from ..logging_config import setup_logging


def _serialize_vec(vec: np.ndarray) -> bytes:
    buf = io.BytesIO()
    # ensure float32 and 1D contiguous
    arr = np.asarray(vec, dtype=np.float32).ravel()
    np.save(buf, arr, allow_pickle=False)
    return buf.getvalue()


def _deserialize_vec(blob: bytes) -> np.ndarray:
    buf = io.BytesIO(blob)
    return np.load(buf, allow_pickle=False).astype(np.float32)


def _load_model(model_name: str) -> SentenceTransformer:
    return SentenceTransformer(model_name)


def encode_texts(model: SentenceTransformer, texts: Sequence[str], batch_size: int = 32) -> np.ndarray:
    embeds = model.encode(
        list(texts),
        batch_size=batch_size,
        show_progress_bar=False,
        convert_to_numpy=True,
        normalize_embeddings=False,
    )
    return embeds.astype(np.float32, copy=False)


def _iter_missing_jobs(conn: sqlite3.Connection, limit: Optional[int] = None) -> Iterable[Tuple[int, str]]:
    q = "SELECT id, description FROM jobs WHERE embedding IS NULL"
    if limit:
        q += " LIMIT ?"
        cur = conn.execute(q, (limit,))
    else:
        cur = conn.execute(q)
    for row in cur:
        yield int(row[0]), str(row[1] or "")


def embed_missing(limit: Optional[int] = None, batch_size: int = 32) -> int:
    log = logging.getLogger("aura.embeddings.embed")
    cfg = load_config()
    model_name = cfg.get("models", {}).get("embedding", "sentence-transformers/all-MiniLM-L6-v2")

    data_dir = Path(cfg["paths"]["data_dir"]) 
    db_path = data_dir / "jobs.db"
    init_sqlite(db_path)

    model = _load_model(model_name)
    log.info("Loaded model %s", model_name)

    updated = 0
    with sqlite3.connect(db_path) as conn:
        conn.execute("PRAGMA journal_mode=WAL;")
        batch_ids: List[int] = []
        batch_texts: List[str] = []
        for job_id, desc in _iter_missing_jobs(conn, limit=limit):
            batch_ids.append(job_id)
            batch_texts.append(desc)
            if len(batch_ids) >= batch_size:
                embs = encode_texts(model, batch_texts, batch_size=batch_size)
                for jid, vec in zip(batch_ids, embs):
                    conn.execute("UPDATE jobs SET embedding = ? WHERE id = ?", (_serialize_vec(vec), jid))
                conn.commit()
                updated += len(batch_ids)
                log.info("Embedded %d jobs (running total: %d)", len(batch_ids), updated)
                batch_ids.clear(); batch_texts.clear()

        if batch_ids:
            embs = encode_texts(model, batch_texts, batch_size=batch_size)
            for jid, vec in zip(batch_ids, embs):
                conn.execute("UPDATE jobs SET embedding = ? WHERE id = ?", (_serialize_vec(vec), jid))
            conn.commit()
            updated += len(batch_ids)
            log.info("Embedded final batch %d (total: %d)", len(batch_ids), updated)

    print(f"Embedded {updated} job descriptions")
    return updated


def _load_all_embeddings(conn: sqlite3.Connection) -> Tuple[np.ndarray, np.ndarray]:
    cur = conn.execute("SELECT id, embedding FROM jobs WHERE embedding IS NOT NULL")
    ids: List[int] = []
    vecs: List[np.ndarray] = []
    for jid, blob in cur:
        try:
            vec = _deserialize_vec(blob)
        except Exception:
            continue
        if vec.ndim != 1:
            vec = vec.ravel()
        ids.append(int(jid))
        vecs.append(vec.astype(np.float32, copy=False))

    if not vecs:
        return np.empty((0, 0), dtype=np.float32), np.empty((0,), dtype=np.int64)

    X = np.vstack(vecs).astype(np.float32, copy=False)
    I = np.asarray(ids, dtype=np.int64)
    return X, I


def build_faiss_index(index_path: Path | None = None) -> Tuple[Path, int, int]:
    log = logging.getLogger("aura.embeddings.index")
    cfg = load_config()
    data_dir = Path(cfg["paths"]["data_dir"]) 
    db_path = data_dir / "jobs.db"
    init_sqlite(db_path)

    if index_path is None:
        index_path = data_dir / "faiss.index"

    with sqlite3.connect(db_path) as conn:
        X, ids = _load_all_embeddings(conn)

    if X.size == 0:
        log.warning("No embeddings found; nothing to index.")
        print("No embeddings found to index.")
        return index_path, 0, 0

    # Normalize to unit vectors for cosine similarity and use Inner Product index
    norms = np.linalg.norm(X, axis=1, keepdims=True) + 1e-12
    Xn = X / norms
    d = Xn.shape[1]

    base = faiss.IndexFlatIP(d)
    index = faiss.IndexIDMap(base)
    index.add_with_ids(Xn, ids)

    index_path.parent.mkdir(parents=True, exist_ok=True)
    faiss.write_index(index, str(index_path))

    log.info("Wrote FAISS index to %s with %d vectors (dim=%d)", index_path, Xn.shape[0], d)
    print(f"Wrote FAISS index to {index_path} with {Xn.shape[0]} vectors (dim={d})")
    return index_path, int(Xn.shape[0]), int(d)


def main(argv: Optional[Sequence[str]] = None) -> int:
    setup_logging()
    parser = argparse.ArgumentParser(description="Embeddings and FAISS index tools")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_embed = sub.add_parser("embed", help="Embed missing job descriptions")
    p_embed.add_argument("--limit", type=int, default=None, help="Limit number of jobs to embed")
    p_embed.add_argument("--batch-size", type=int, default=32, help="Batch size for encoding")

    p_index = sub.add_parser("index", help="Build FAISS index from embedded jobs")
    p_index.add_argument("--path", type=str, default=None, help="Path to write index (default: data/faiss.index)")

    args = parser.parse_args(argv)

    if args.cmd == "embed":
        embed_missing(limit=args.limit, batch_size=args.batch_size)
        return 0
    elif args.cmd == "index":
        index_path = Path(args.path) if args.path else None
        build_faiss_index(index_path)
        return 0
    return 1


if __name__ == "__main__":
    raise SystemExit(main())

