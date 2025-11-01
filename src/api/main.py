"""FastAPI application exposing health, jobs, and search endpoints.

Run locally:
  uvicorn src.api.main:app --reload --port 8000
"""

from __future__ import annotations

import json
import sqlite3
from functools import lru_cache
from pathlib import Path
from typing import List, Optional

import numpy as np
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ..config import load_config


class JobOut(BaseModel):
    id: int
    title: str
    company: str
    location: Optional[str] = None
    date_posted: Optional[str] = None
    url: str


class ScoredJob(JobOut):
    score: float


@lru_cache(maxsize=1)
def get_cfg() -> dict:
    return load_config()


def _db_path() -> Path:
    cfg = get_cfg()
    return Path(cfg["paths"]["data_dir"]) / "jobs.db"


@lru_cache(maxsize=1)
def _model():
    # Lazy import to keep import time fast
    from sentence_transformers import SentenceTransformer

    cfg = get_cfg()
    model_name = cfg.get("models", {}).get("embedding", "sentence-transformers/all-MiniLM-L6-v2")
    return SentenceTransformer(model_name)


@lru_cache(maxsize=1)
def _faiss_index():
    import faiss  # type: ignore

    cfg = get_cfg()
    idx_path = Path(cfg["paths"]["data_dir"]) / "faiss.index"
    if not idx_path.exists():
        return None
    return faiss.read_index(str(idx_path))


def _query_top_k(text: str, k: int = 10):
    import faiss  # type: ignore

    index = _faiss_index()
    if index is None:
        raise HTTPException(status_code=503, detail="FAISS index not found; build it first")
    model = _model()
    vec = model.encode([text], convert_to_numpy=True, normalize_embeddings=False).astype(np.float32)
    vec /= np.linalg.norm(vec, axis=1, keepdims=True) + 1e-12
    D, I = index.search(vec, k)
    return D.ravel(), I.ravel().astype(int)


app = FastAPI(title="AURA API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthz")
def healthz() -> dict:
    cfg = get_cfg()
    db_exists = _db_path().exists()
    idx_exists = (Path(cfg["paths"]["data_dir"]) / "faiss.index").exists()
    return {
        "status": "ok",
        "db": db_exists,
        "index": idx_exists,
    }


@app.get("/jobs", response_model=List[JobOut])
def list_jobs(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    q: Optional[str] = Query(None, description="Simple search over title/company"),
) -> List[JobOut]:
    db_path = _db_path()
    if not db_path.exists():
        return []
    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        if q:
            cur = conn.execute(
                """
                SELECT id, title, company, location, date_posted, url
                FROM jobs
                WHERE title LIKE ? OR company LIKE ?
                ORDER BY date_posted DESC NULLS LAST, id DESC
                LIMIT ? OFFSET ?
                """,
                (f"%{q}%", f"%{q}%", limit, offset),
            )
        else:
            cur = conn.execute(
                """
                SELECT id, title, company, location, date_posted, url
                FROM jobs
                ORDER BY date_posted DESC NULLS LAST, id DESC
                LIMIT ? OFFSET ?
                """,
                (limit, offset),
            )
        rows = [JobOut(**dict(r)) for r in cur.fetchall()]
    return rows


@app.get("/search", response_model=List[ScoredJob])
def search(
    q: str = Query(..., min_length=2),
    k: int = Query(10, ge=1, le=50),
) -> List[ScoredJob]:
    scores, ids = _query_top_k(q, k=k)

    db_path = _db_path()
    if not db_path.exists():
        return []
    placeholders = ",".join(["?"] * len(ids))
    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.execute(
            f"SELECT id, title, company, location, date_posted, url FROM jobs WHERE id IN ({placeholders})",
            ids.tolist(),
        )
        rows = cur.fetchall()

    # order by returned ids
    order = {int(i): idx for idx, i in enumerate(ids.tolist())}
    out: List[ScoredJob] = []
    for r in sorted(rows, key=lambda r: order.get(int(r["id"]), 1_000_000)):
        idx = order[int(r["id"])]
        out.append(ScoredJob(**dict(r), score=float(scores[idx])))
    return out

