"""FastAPI application exposing health, jobs, and search endpoints.

Run locally:
  uvicorn src.api.main:app --reload --port 8000
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import List, Optional

import numpy as np
from fastapi import FastAPI, HTTPException, Query
import os
from sqlalchemy import text
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ..config import load_config
from ..logging_config import setup_logging
from ..ranking.rank import rank as rank_fn, RankedItem
from ..db.session import get_session, get_database_url
from ..db.models import Job, Rating


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


def _index_path() -> Path:
    cfg = get_cfg()
    return Path(cfg["paths"]["data_dir"]) / "faiss.index"


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

    idx_path = _index_path()
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

# CORS: read allowed origins from env (comma-separated). Example:
# ALLOWED_ORIGINS=https://aura.carlospada.me,https://www.aura.carlospada.me
allowed = os.getenv("ALLOWED_ORIGINS")
allowed_origins = [o.strip() for o in allowed.split(",") if o.strip()] if allowed else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup_logging() -> None:
    # Configure logging (console + rotating file)
    setup_logging()


@app.get("/healthz")
def healthz() -> dict:
    # DB: attempt a trivial query
    try:
        with get_session() as session:
            session.execute(text("SELECT 1"))
        db_exists = True
    except Exception:
        db_exists = False
    idx_exists = _index_path().exists()
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
    with get_session() as session:
        query = session.query(Job.id, Job.title, Job.company, Job.location, Job.date_posted, Job.url)
        if q:
            like = f"%{q}%"
            # ilike on SQLite acts like like; on PG it's case-insensitive
            query = query.filter((Job.title.ilike(like)) | (Job.company.ilike(like)))
        # For portability, sort by date_posted desc, id desc
        query = query.order_by(Job.date_posted.desc().nullslast(), Job.id.desc())
        rows = [
            JobOut(
                id=int(r[0]),
                title=r[1],
                company=r[2],
                location=r[3],
                date_posted=r[4],
                url=r[5],
            )
            for r in query.limit(limit).offset(offset).all()
        ]
        return rows


@app.get("/jobs/{job_id}", response_model=JobOut)
def get_job(job_id: int) -> JobOut:
    with get_session() as session:
        r = (
            session.query(Job.id, Job.title, Job.company, Job.location, Job.date_posted, Job.url)
            .filter(Job.id == job_id)
            .first()
        )
        if not r:
            raise HTTPException(status_code=404, detail="job not found")
        return JobOut(
            id=int(r[0]),
            title=r[1],
            company=r[2],
            location=r[3],
            date_posted=r[4],
            url=r[5],
        )


@app.get("/search", response_model=List[ScoredJob])
def search(
    q: str = Query(..., min_length=2),
    k: int = Query(10, ge=1, le=50),
) -> List[ScoredJob]:
    scores, ids = _query_top_k(q, k=k)

    if len(ids) == 0:
        return []
    with get_session() as session:
        rows = (
            session.query(Job.id, Job.title, Job.company, Job.location, Job.date_posted, Job.url)
            .filter(Job.id.in_(ids.tolist()))
            .all()
        )

    # order by returned ids
    order = {int(i): idx for idx, i in enumerate(ids.tolist())}
    out: List[ScoredJob] = []
    for r in sorted(rows, key=lambda r: order.get(int(r[0]), 1_000_000)):
        idx = order[int(r[0])]
        out.append(
            ScoredJob(
                id=int(r[0]),
                title=r[1],
                company=r[2],
                location=r[3],
                date_posted=r[4],
                url=r[5],
                score=float(scores[idx]),
            )
        )
    return out


@app.get("/rank", response_model=List[ScoredJob])
def rank_endpoint(
    q: str = Query(..., min_length=2),
    k: int = Query(50, ge=1, le=200),
    top: int = Query(10, ge=1, le=50),
) -> List[ScoredJob]:
    try:
        items: List[RankedItem] = rank_fn(q, k=k, top=top)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    out: List[ScoredJob] = []
    for it in items:
        out.append(
            ScoredJob(
                id=it.id,
                title=it.title,
                company=it.company,
                location=it.location_str,
                date_posted=it.date_posted,
                url=it.url,
                score=float(it.score),
            )
        )
    return out


class RatingIn(BaseModel):
    job_id: int
    fit_score: int
    interest_score: int
    prestige_score: int
    location_score: int
    comment: Optional[str] = None


@app.post("/ratings")
def create_rating(r: RatingIn) -> dict:
    # validate DB reachable
    try:
        with get_session() as session:
            session.execute("SELECT 1")
    except Exception:
        raise HTTPException(status_code=503, detail="Database not initialized")
    # validate scores 1..10
    for k in ("fit_score", "interest_score", "prestige_score", "location_score"):
        v = getattr(r, k)
        if not (1 <= v <= 10):
            raise HTTPException(status_code=422, detail=f"{k} must be between 1 and 10")

    import datetime as dt

    with get_session() as session:
        exists = session.query(Job.id).filter(Job.id == r.job_id).first()
        if not exists:
            raise HTTPException(status_code=404, detail="job not found")
        rating = Rating(
            job_id=r.job_id,
            fit_score=r.fit_score,
            interest_score=r.interest_score,
            prestige_score=r.prestige_score,
            location_score=r.location_score,
            comment=(r.comment or "").strip() or None,
            timestamp=dt.datetime.utcnow(),
        )
        session.add(rating)
    return {"ok": True}
