import os
from typing import List, Optional

from fastapi import FastAPI, Depends, Query, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ..db import get_session, init_db
from ..models import Job, User, Preference, Qualification, Rating, Application
from ..services.search import search_jobs, rank_jobs
from ..ingestion.remoteok import ingest_remoteok
from ..services.generation import generate_docs_text
from ..auth import get_identity


def get_allowed_origins() -> list[str]:
    raw = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
    return [o.strip() for o in raw.split(",") if o.strip()]


app = FastAPI(title="AURA API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthz")
def healthz():
    return {"status": "ok"}


class JobOut(BaseModel):
    id: int
    source: str
    external_id: str
    title: str
    company: str
    location: str
    url: str
    salary_min: float | None = None
    salary_max: float | None = None
    is_estimated: int
    description: str
    posted_ts: int | None = None

    @classmethod
    def from_orm_job(cls, j: Job) -> "JobOut":
        return cls(
            id=j.id,
            source=j.source,
            external_id=j.external_id,
            title=j.title,
            company=j.company,
            location=j.location,
            url=j.url,
            salary_min=j.salary_min,
            salary_max=j.salary_max,
            is_estimated=int(getattr(j, "is_estimated", 0)),
            description=j.description,
            posted_ts=j.posted_ts,
        )


@app.on_event("startup")
def _startup() -> None:
    init_db()


@app.post("/ingest/remoteok")
def ingest_remoteok_endpoint(
    q: Optional[str] = Query(default=None),
    limit: int = 50,
    db=Depends(get_session),
):
    count = ingest_remoteok(db, q=q, limit=limit)
    return {"ingested": count}


@app.get("/jobs", response_model=List[JobOut])
def list_jobs(q: Optional[str] = Query(default=None), k: int = 50, db=Depends(get_session)):
    jobs = search_jobs(db, q=q, k=k)
    return [JobOut.from_orm_job(j) for j in jobs]


@app.get("/jobs/{job_id}", response_model=JobOut)
def get_job(job_id: int, db=Depends(get_session)):
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Not found")
    return JobOut.from_orm_job(job)


@app.get("/rank")
def rank(q: Optional[str] = Query(default=None), k: int = 50, top: int = 10, db=Depends(get_session)):
    ranked = rank_jobs(db, q=q, k=k, top=top)
    return {
        "query": q,
        "k": k,
        "top": top,
        "ranked": [
            {"score": r.score, "job": JobOut.from_orm_job(r.job).dict()} for r in ranked
        ],
    }


class GenerateRequest(BaseModel):
    job_id: int


@app.post("/generate/application")
def generate_application(body: GenerateRequest, db=Depends(get_session)):
    job = db.get(Job, body.job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    cv, cl = generate_docs_text(job)
    return {"cv": cv, "cl": cl}


# -------- Auth helper --------

def _ensure_user(db, identity: dict) -> User:
    clerk_id = identity.get("sub")
    email = identity.get("email") or ""
    user = db.query(User).filter(User.clerk_id == clerk_id).one_or_none()
    if user:
        return user
    import time as _t

    user = User(clerk_id=clerk_id, email=email, created_at=int(_t.time()))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# -------- Me: Preferences --------

class PrefsBody(BaseModel):
    roles: Optional[List[str]] = None
    locations: Optional[List[str]] = None
    industries: Optional[List[str]] = None
    minSalary: Optional[float] = None
    remoteWeight: Optional[float] = None


@app.get("/me/preferences")
def get_prefs(req: Request, db=Depends(get_session), identity=Depends(get_identity)):
    user = _ensure_user(db, identity)
    pref = (
        db.query(Preference)
        .filter(Preference.user_id == user.id)
        .order_by(Preference.updated_at.desc())
        .first()
    )
    if not pref:
        return None
    return {
        "roles": pref.roles or [],
        "locations": pref.locations or [],
        "industries": pref.industries or [],
        "minSalary": pref.min_salary,
        "remoteWeight": pref.remote_weight,
        "updatedAt": pref.updated_at,
    }


@app.put("/me/preferences")
def put_prefs(body: PrefsBody, req: Request, db=Depends(get_session), identity=Depends(get_identity)):
    import time as _t

    user = _ensure_user(db, identity)
    now = int(_t.time())
    pref = (
        db.query(Preference)
        .filter(Preference.user_id == user.id)
        .order_by(Preference.updated_at.desc())
        .first()
    )
    if pref:
        pref.roles = body.roles or []
        pref.locations = body.locations or []
        pref.industries = body.industries or []
        pref.min_salary = body.minSalary
        pref.remote_weight = body.remoteWeight
        pref.updated_at = now
    else:
        db.add(
            Preference(
                user_id=user.id,
                roles=body.roles or [],
                locations=body.locations or [],
                industries=body.industries or [],
                min_salary=body.minSalary,
                remote_weight=body.remoteWeight,
                updated_at=now,
            )
        )
    db.commit()
    return {"ok": True}


# -------- Me: Qualifications --------

class QualsBody(BaseModel):
    structuredCv: dict | list | None = None


@app.get("/me/qualifications")
def get_quals(req: Request, db=Depends(get_session), identity=Depends(get_identity)):
    user = _ensure_user(db, identity)
    doc = (
        db.query(Qualification)
        .filter(Qualification.user_id == user.id)
        .order_by(Qualification.updated_at.desc())
        .first()
    )
    if not doc:
        return None
    return {"structuredCv": doc.structured_cv, "updatedAt": doc.updated_at}


@app.put("/me/qualifications")
def put_quals(body: QualsBody, req: Request, db=Depends(get_session), identity=Depends(get_identity)):
    import time as _t

    user = _ensure_user(db, identity)
    now = int(_t.time())
    doc = (
        db.query(Qualification)
        .filter(Qualification.user_id == user.id)
        .order_by(Qualification.updated_at.desc())
        .first()
    )
    if doc:
        doc.structured_cv = body.structuredCv
        doc.updated_at = now
    else:
        db.add(Qualification(user_id=user.id, structured_cv=body.structuredCv, updated_at=now))
    db.commit()
    return {"ok": True}


# -------- Me: Ratings --------

class RatingBody(BaseModel):
    jobKey: str
    stars: int


@app.get("/me/ratings")
def get_ratings(req: Request, db=Depends(get_session), identity=Depends(get_identity)):
    user = _ensure_user(db, identity)
    items = db.query(Rating).filter(Rating.user_id == user.id).all()
    return [{"jobKey": it.job_key, "stars": it.stars} for it in items]


@app.put("/me/ratings")
def put_rating(body: RatingBody, req: Request, db=Depends(get_session), identity=Depends(get_identity)):
    import time as _t

    if body.stars < 1 or body.stars > 5:
        raise HTTPException(status_code=400, detail="stars must be 1-5")
    user = _ensure_user(db, identity)
    it = (
        db.query(Rating)
        .filter(Rating.user_id == user.id, Rating.job_key == body.jobKey)
        .one_or_none()
    )
    now = int(_t.time())
    if it:
        it.stars = body.stars
        it.updated_at = now
    else:
        db.add(Rating(user_id=user.id, job_key=body.jobKey, stars=body.stars, created_at=now, updated_at=now))
    db.commit()
    return {"ok": True}


# -------- Me: Applications --------

class AppBody(BaseModel):
    jobKey: str
    userRating: Optional[int] = None
    generatedDocs: Optional[dict] = None


@app.get("/me/applications")
def list_apps(req: Request, db=Depends(get_session), identity=Depends(get_identity)):
    user = _ensure_user(db, identity)
    items = db.query(Application).filter(Application.user_id == user.id).order_by(Application.created_at.desc()).all()
    return [
        {
            "id": it.id,
            "jobKey": it.job_key,
            "userRating": it.user_rating,
            "status": it.status,
            "statusHistory": it.status_history or [],
            "generatedDocs": it.generated_docs,
            "createdAt": it.created_at,
        }
        for it in items
    ]


@app.post("/me/applications")
def upsert_app(body: AppBody, req: Request, db=Depends(get_session), identity=Depends(get_identity)):
    import time as _t

    user = _ensure_user(db, identity)
    it = (
        db.query(Application)
        .filter(Application.user_id == user.id, Application.job_key == body.jobKey)
        .one_or_none()
    )
    now = int(_t.time())
    if it:
        it.user_rating = body.userRating if body.userRating is not None else it.user_rating
        it.generated_docs = body.generatedDocs if body.generatedDocs is not None else it.generated_docs
        db.commit()
        return {"id": it.id}
    app = Application(
        user_id=user.id,
        job_key=body.jobKey,
        user_rating=body.userRating,
        status="draft",
        status_history=[{"status": "draft", "at": now}],
        generated_docs=body.generatedDocs,
        created_at=now,
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return {"id": app.id}


class AppStatusBody(BaseModel):
    jobKey: str
    status: str


@app.patch("/me/applications/status")
def set_status(body: AppStatusBody, req: Request, db=Depends(get_session), identity=Depends(get_identity)):
    import time as _t

    user = _ensure_user(db, identity)
    it = (
        db.query(Application)
        .filter(Application.user_id == user.id, Application.job_key == body.jobKey)
        .one_or_none()
    )
    if not it:
        raise HTTPException(status_code=404, detail="Application not found")
    now = int(_t.time())
    hist = list(it.status_history or [])
    hist.append({"status": body.status, "at": now})
    it.status = body.status
    it.status_history = hist
    db.commit()
    return {"ok": True}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)
