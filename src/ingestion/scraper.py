"""Scraper stubs for job sources.

Each function should fetch and normalize job postings into a common
dictionary format compatible with the DB schema.
"""

from __future__ import annotations

from typing import Dict, Iterable, List


NormalizedJob = Dict[str, object]


def fetch_remoteok() -> List[NormalizedJob]:
    """Placeholder: fetch jobs from RemoteOK API.

    Returns a list of normalized job dictionaries.
    """
    return []


def fetch_indeed() -> List[NormalizedJob]:
    """Placeholder: fetch jobs from Indeed (via search terms)."""
    return []


def fetch_all() -> Iterable[NormalizedJob]:
    """Aggregate from all configured sources."""
    yield from fetch_remoteok()
    yield from fetch_indeed()

