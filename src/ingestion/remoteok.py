"""RemoteOK ingestion client.

Fetches recent job listings from RemoteOK API, normalizes fields, and
inserts them into the local SQLite database defined by config.

Usage:
  python -m src.ingestion.remoteok --days 7
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import logging
import time
import urllib.error
import urllib.request
from typing import Any, Dict, Iterable, List, Optional

from ..config import load_config
from ..logging_config import setup_logging
from ..db.session import get_session
from ..db.models import Job


REMOTEOK_API = "https://remoteok.io/api"  # public JSON API


def fetch_remoteok() -> List[Dict[str, Any]]:
    req = urllib.request.Request(REMOTEOK_API, headers={"User-Agent": "AURA/0.1"})
    with urllib.request.urlopen(req, timeout=20) as resp:  # nosec B310
        data = resp.read()
    try:
        return json.loads(data)
    except json.JSONDecodeError:
        return []


def normalize_item(item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    # RemoteOK includes a metadata object at index 0 without job fields; skip it.
    position = item.get("position") or item.get("title")
    company = item.get("company")
    url = item.get("url")
    if not (position and company and url):
        return None

    # Date handling: prefer ISO date, fallback to epoch
    date_posted: Optional[str]
    if (d := item.get("date")):
        # Example: "2023-10-28T10:23:00+00:00"
        try:
            # normalize to YYYY-MM-DD
            date_posted = d[:10]
        except Exception:
            date_posted = None
    elif (e := item.get("epoch")):
        try:
            date_posted = time.strftime("%Y-%m-%d", time.gmtime(int(e)))
        except Exception:
            date_posted = None
    else:
        date_posted = None

    desc = item.get("description") or item.get("desc") or ""
    location = item.get("location") or item.get("candidate_required_location") or "Remote"

    # Salary often free-text; leave None for MVP
    salary_min = None
    salary_max = None
    currency = None

    return {
        "title": str(position),
        "company": str(company),
        "location": str(location) if location else None,
        "salary_min": salary_min,
        "salary_max": salary_max,
        "currency": currency,
        "description": str(desc),
        "url": str(url),
        "date_posted": date_posted,
    }


def filter_recent(items: Iterable[Dict[str, Any]], days: int) -> List[Dict[str, Any]]:
    if days <= 0:
        return list(items)
    cutoff = dt.date.today() - dt.timedelta(days=days)
    out: List[Dict[str, Any]] = []
    for it in items:
        d = it.get("date_posted")
        if not d:
            continue
        try:
            if dt.date.fromisoformat(d) >= cutoff:
                out.append(it)
        except ValueError:
            continue
    return out


def insert_jobs(*args, **kwargs) -> int:
    # Deprecated; kept for compatibility in earlier code paths.
    return 0


def run(days: int = 7) -> int:
    log = logging.getLogger("aura.ingestion.remoteok")
    cfg = load_config()

    try:
        raw = fetch_remoteok()
    except (urllib.error.URLError, TimeoutError) as e:
        log.error("Failed to fetch RemoteOK: %s", e)
        return 2

    norm = [n for n in (normalize_item(x) for x in raw) if n]
    recent = filter_recent(norm, days)
    log.info("Fetched %d items; %d normalized; %d recent (<=%d days)", len(raw), len(norm), len(recent), days)

    # Insert via ORM with de-dup on URL
    inserted = 0
    with get_session() as session:
        for j in recent:
            exists = session.query(Job.id).filter(Job.url == j["url"]).first()
            if exists:
                continue
            obj = Job(
                title=j["title"],
                company=j["company"],
                location=j.get("location"),
                salary_min=j.get("salary_min"),
                salary_max=j.get("salary_max"),
                currency=j.get("currency"),
                description=j.get("description", ""),
                url=j["url"],
                date_posted=j.get("date_posted"),
            )
            session.add(obj)
            inserted += 1
    log.info("Inserted %d new jobs", inserted)
    print(f"Inserted {inserted} new jobs from RemoteOK (last {days} days)")
    return 0


def main(argv: Optional[List[str]] = None) -> int:
    setup_logging()
    parser = argparse.ArgumentParser(description="Ingest jobs from RemoteOK")
    parser.add_argument("--days", type=int, default=7, help="Only include jobs posted within this many days")
    args = parser.parse_args(argv)
    return run(days=args.days)


if __name__ == "__main__":
    raise SystemExit(main())
