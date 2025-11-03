from __future__ import annotations

import time
from typing import Iterable

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Job


def _normalize(item: dict) -> dict:
    title = item.get("position") or item.get("title") or ""
    company = item.get("company") or ""
    location = item.get("location") or ("remote" if item.get("remote") else "")
    url = item.get("url") or item.get("apply_url") or ""
    description = (item.get("description") or item.get("tags") or "")
    ext_id = str(item.get("id") or item.get("slug") or f"{company}-{title}")
    posted = int(item.get("epoch") or time.time())
    return {
        "source": "remoteok",
        "external_id": ext_id,
        "title": title,
        "company": company,
        "location": location,
        "url": url,
        "salary_min": None,
        "salary_max": None,
        "is_estimated": 0,
        "description": description if isinstance(description, str) else ", ".join(description),
        "posted_ts": posted,
    }


def upsert_job(db: Session, data: dict) -> Job:
    existing = db.execute(
        select(Job).where(Job.source == data["source"], Job.external_id == data["external_id"])  # type: ignore[index]
    ).scalar_one_or_none()
    if existing:
        for k, v in data.items():
            setattr(existing, k, v)
        return existing
    job = Job(**data)
    db.add(job)
    return job


def ingest_remoteok(db: Session, q: str | None = None, limit: int = 50) -> int:
    url = "https://remoteok.com/api"
    try:
        with httpx.Client(timeout=10) as client:
            resp = client.get(url)
            resp.raise_for_status()
            data = resp.json()
    except Exception:
        # Fallback to empty list on network issues.
        data = []

    # RemoteOK API returns a first metadata record; skip non-dicts with expected fields
    items: Iterable[dict] = [d for d in data if isinstance(d, dict) and (d.get("position") or d.get("title"))]
    count = 0
    for rec in items:
        norm = _normalize(rec)
        if q and q.lower() not in (norm["title"] + " " + norm["description"]).lower():
            continue
        upsert_job(db, norm)
        count += 1
        if count >= limit:
            break
    db.commit()
    return count

