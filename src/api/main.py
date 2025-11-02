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
from fastapi import FastAPI, HTTPException, Query, Depends
import os
from sqlalchemy import text
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import datetime as dt

from ..config import load_config
from ..logging_config import setup_logging
from ..ranking.rank import rank as rank_fn, RankedItem
from ..db.session import get_session, get_database_url
from ..db.models import Job, Rating, User, Preferences, Batch, BatchJob
from .auth import get_current_user


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


@app.get("/me")
def me(claims: dict = Depends(get_current_user)) -> dict:
    if not claims:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return {"sub": claims.get("sub"), "email": claims.get("email"), "name": claims.get("name")}


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
    stars: Optional[int] = None
    fit_score: Optional[int] = None
    interest_score: Optional[int] = None
    prestige_score: Optional[int] = None
    location_score: Optional[int] = None
    comment: Optional[str] = None


@app.post("/ratings")
def create_rating(r: RatingIn, claims: dict = Depends(get_current_user)) -> dict:
    if not claims:
        raise HTTPException(status_code=401, detail="Unauthorized")
    # validate DB reachable
    try:
        with get_session() as session:
            session.execute("SELECT 1")
    except Exception:
        raise HTTPException(status_code=503, detail="Database not initialized")
    # Validate either stars (1..5) or component scores (1..10)
    if r.stars is not None:
        if not (1 <= int(r.stars) <= 5):
            raise HTTPException(status_code=422, detail="stars must be between 1 and 5")
    else:
        for k in ("fit_score", "interest_score", "prestige_score", "location_score"):
            v = getattr(r, k)
            if v is None or not (1 <= int(v) <= 10):
                raise HTTPException(status_code=422, detail=f"{k} must be between 1 and 10")

    import datetime as dt

    with get_session() as session:
        user = _get_or_create_user(session, claims)
        exists = session.query(Job.id).filter(Job.id == r.job_id).first()
        if not exists:
            raise HTTPException(status_code=404, detail="job not found")
        rating = Rating(
            job_id=r.job_id,
            user_id=user.id,
            stars=r.stars,
            fit_score=r.fit_score if r.fit_score is not None else None,
            interest_score=r.interest_score if r.interest_score is not None else None,
            prestige_score=r.prestige_score if r.prestige_score is not None else None,
            location_score=r.location_score if r.location_score is not None else None,
            comment=(r.comment or "").strip() or None,
            timestamp=dt.datetime.utcnow(),
        )
        session.add(rating)
    return {"ok": True}


class PreferencesIn(BaseModel):
    roles: Optional[List[str]] = None
    experience: Optional[str] = None
    location_mode: Optional[str] = None
    location_text: Optional[str] = None
    include_skills: Optional[List[str]] = None
    exclude_skills: Optional[List[str]] = None
    company_types: Optional[List[str]] = None
    batch_size: Optional[int] = None
    frequency_days: Optional[int] = None
    cv_url: Optional[str] = None


class PreferencesOut(PreferencesIn):
    user_id: int


def _get_or_create_user(session, claims: dict) -> User:
    email = claims.get("email")
    sub = claims.get("sub")
    q = session.query(User)
    if email:
        user = q.filter(User.email == email).first()
        if user:
            if sub and not user.sub:
                user.sub = sub
            return user
    if sub:
        user = q.filter(User.sub == sub).first()
        if user:
            if email and not user.email:
                user.email = email
            return user
    # create new
    user = User(email=email, sub=sub, name=claims.get("name"), created_at=dt.datetime.utcnow())
    session.add(user)
    session.flush()
    return user


@app.get("/preferences", response_model=PreferencesOut)
def get_preferences(claims: dict = Depends(get_current_user)):
    if not claims:
        raise HTTPException(status_code=401, detail="Unauthorized")
    with get_session() as session:
        user = _get_or_create_user(session, claims)
        prefs = session.query(Preferences).filter(Preferences.user_id == user.id).first()
        if not prefs:
            prefs = Preferences(user_id=user.id)
            session.add(prefs)
            session.flush()
        return PreferencesOut(
            user_id=user.id,
            roles=prefs.roles,
            experience=prefs.experience,
            location_mode=prefs.location_mode,
            location_text=prefs.location_text,
            include_skills=prefs.include_skills,
            exclude_skills=prefs.exclude_skills,
            company_types=prefs.company_types,
            batch_size=prefs.batch_size,
            frequency_days=prefs.frequency_days,
            cv_url=prefs.cv_url,
        )


@app.put("/preferences", response_model=PreferencesOut)
def put_preferences(payload: PreferencesIn, claims: dict = Depends(get_current_user)):
    if not claims:
        raise HTTPException(status_code=401, detail="Unauthorized")
    with get_session() as session:
        user = _get_or_create_user(session, claims)
        prefs = session.query(Preferences).filter(Preferences.user_id == user.id).first()
        if not prefs:
            prefs = Preferences(user_id=user.id)
            session.add(prefs)
        # Update fields
        for field, value in payload.dict(exclude_unset=True).items():
            setattr(prefs, field, value)
        session.flush()
        return PreferencesOut(user_id=user.id, **payload.dict(exclude_unset=True))


class BatchOut(BaseModel):
    id: int
    jobs: List[JobOut]


@app.post("/batches", response_model=BatchOut)
def create_batch(limit: int = Query(None, ge=1, le=50), claims: dict = Depends(get_current_user)):
    if not claims:
        raise HTTPException(status_code=401, detail="Unauthorized")
    with get_session() as session:
        user = _get_or_create_user(session, claims)
        # Do not create a new batch if there is an unlocked one
        existing = (
            session.query(Batch.id)
            .filter(Batch.user_id == user.id, Batch.locked_at.is_(None))
            .first()
        )
        if existing:
            # Return current instead
            return get_current_batch(claims)
        # Determine batch size from preferences or query param
        prefs = session.query(Preferences).filter(Preferences.user_id == user.id).first()
        batch_size = limit or (prefs.batch_size if prefs and prefs.batch_size else 5)
        # Create batch
        b = Batch(user_id=user.id, created_at=dt.datetime.utcnow())
        session.add(b)
        session.flush()
        # Select most recent jobs as a simple heuristic
        q = (
            session.query(Job.id, Job.title, Job.company, Job.location, Job.date_posted, Job.url)
            .order_by(Job.date_posted.desc().nullslast(), Job.id.desc())
            .limit(batch_size)
        )
        rows = q.all()
        for r in rows:
            session.add(BatchJob(batch_id=b.id, job_id=int(r[0])))
        session.flush()
        jobs = [
            JobOut(id=int(r[0]), title=r[1], company=r[2], location=r[3], date_posted=r[4], url=r[5])
            for r in rows
        ]
        return BatchOut(id=b.id, jobs=jobs)


@app.get("/batches/current", response_model=BatchOut)
def get_current_batch(claims: dict = Depends(get_current_user)):
    if not claims:
        raise HTTPException(status_code=401, detail="Unauthorized")
    with get_session() as session:
        user = _get_or_create_user(session, claims)
        b = (
            session.query(Batch.id)
            .filter(Batch.user_id == user.id, Batch.locked_at.is_(None))
            .order_by(Batch.id.desc())
            .first()
        )
        if not b:
            raise HTTPException(status_code=404, detail="no current batch")
        # Load jobs
        job_ids = [
            int(r[0])
            for r in session.query(BatchJob.job_id).filter(BatchJob.batch_id == int(b[0])).all()
        ]
        if not job_ids:
            return BatchOut(id=int(b[0]), jobs=[])
        placeholders = job_ids
        rows = (
            session.query(Job.id, Job.title, Job.company, Job.location, Job.date_posted, Job.url)
            .filter(Job.id.in_(placeholders))
            .all()
        )
        jobs = [
            JobOut(id=int(r[0]), title=r[1], company=r[2], location=r[3], date_posted=r[4], url=r[5])
            for r in rows
        ]
        return BatchOut(id=int(b[0]), jobs=jobs)


@app.post("/batches/{batch_id}/lock")
def lock_batch(batch_id: int, claims: dict = Depends(get_current_user)) -> dict:
    if not claims:
        raise HTTPException(status_code=401, detail="Unauthorized")
    with get_session() as session:
        user = _get_or_create_user(session, claims)
        b = session.query(Batch).filter(Batch.id == batch_id, Batch.user_id == user.id).first()
        if not b:
            raise HTTPException(status_code=404, detail="batch not found")
        if b.locked_at is not None:
            return {"ok": True}
        b.locked_at = dt.datetime.utcnow()
        session.flush()
        return {"ok": True}
