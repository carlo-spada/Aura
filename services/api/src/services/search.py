from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, List

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from ..models import Job


@dataclass
class RankedJob:
    job: Job
    score: float


def search_jobs(db: Session, q: str | None = None, k: int = 50) -> List[Job]:
    stmt = select(Job)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(Job.title.ilike(like), Job.description.ilike(like), Job.company.ilike(like)))
    stmt = stmt.limit(k)
    return list(db.execute(stmt).scalars())


def rank_jobs(db: Session, q: str | None = None, k: int = 50, top: int = 10) -> List[RankedJob]:
    jobs = search_jobs(db, q=q, k=k)
    ql = (q or "").lower()
    ranked: List[RankedJob] = []
    for j in jobs:
        text = f"{j.title} {j.company} {j.description}".lower()
        score = 0.0
        if ql:
            score += text.count(ql) * 2.0
            score += (1.0 if ql in j.title.lower() else 0.0) * 3.0
        # light recency boost
        if j.posted_ts:
            score += (j.posted_ts % 10) / 10.0
        ranked.append(RankedJob(job=j, score=score))
    ranked.sort(key=lambda r: r.score, reverse=True)
    return ranked[:top]

