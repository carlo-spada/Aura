"""Heuristic ranking combining semantic similarity with metadata.

CLI usage:
  python -m src.ranking.rank --q "data scientist nlp remote" --k 50 --top 10
"""

from __future__ import annotations

import argparse
import datetime as dt
import sqlite3
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Sequence, Tuple

import numpy as np

from ..config import load_config
from ..logging_config import setup_logging


@dataclass
class RankedItem:
    id: int
    score: float
    semantic: float
    recency: float
    location: float
    title: str
    company: str
    location_str: Optional[str]
    date_posted: Optional[str]
    url: str


def _faiss_search(text: str, k: int) -> Tuple[np.ndarray, np.ndarray]:
    import faiss  # type: ignore
    from sentence_transformers import SentenceTransformer

    cfg = load_config()
    model_name = cfg.get("models", {}).get("embedding", "sentence-transformers/all-MiniLM-L6-v2")
    model = SentenceTransformer(model_name)
    idx_path = Path(cfg["paths"]["data_dir"]) / "faiss.index"
    if not idx_path.exists():
        raise RuntimeError("FAISS index not found. Build it first.")
    index = faiss.read_index(str(idx_path))

    vec = model.encode([text], convert_to_numpy=True, normalize_embeddings=False).astype(np.float32)
    vec /= np.linalg.norm(vec, axis=1, keepdims=True) + 1e-12
    D, I = index.search(vec, k)
    return D.ravel(), I.ravel().astype(int)


def _fetch_jobs(conn: sqlite3.Connection, ids: Iterable[int]) -> Dict[int, sqlite3.Row]:
    ids = list(ids)
    if not ids:
        return {}
    placeholders = ",".join(["?"] * len(ids))
    cur = conn.execute(
        f"SELECT id, title, company, location, date_posted, url FROM jobs WHERE id IN ({placeholders})",
        ids,
    )
    return {int(r["id"]): r for r in cur.fetchall()}


def _score_recency(date_posted: Optional[str], decay_days: int) -> float:
    if not date_posted:
        return 0.0
    try:
        d = dt.date.fromisoformat(date_posted)
    except Exception:
        return 0.0
    days = max(0, (dt.date.today() - d).days)
    return float(np.exp(-days / max(decay_days, 1)))


def _score_location(loc: Optional[str], remote_bonus: float) -> float:
    if not loc:
        return 0.0
    s = loc.strip().lower()
    return float(remote_bonus) if ("remote" in s) else 0.0


def rank(query: str, k: int = 50, top: int = 10) -> List[RankedItem]:
    cfg = load_config()
    weights = cfg.get("ranking", {}).get("weights", {})
    w_sem = float(weights.get("semantic", 0.7))
    w_rec = float(weights.get("recency", 0.25))
    w_loc = float(weights.get("location", 0.05))
    decay_days = int(cfg.get("ranking", {}).get("decay_days", 30))
    remote_bonus = float(cfg.get("ranking", {}).get("remote_bonus", 1.0))

    scores, ids = _faiss_search(query, k)
    # FAISS IP on unit vectors is cosine in [-1, 1]; map to [0,1]
    sem01 = (scores + 1.0) / 2.0

    db_path = Path(cfg["paths"]["data_dir"]) / "jobs.db"
    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        rows = _fetch_jobs(conn, ids.tolist())

    items: List[RankedItem] = []
    for i, jid in enumerate(ids.tolist()):
        r = rows.get(int(jid))
        if not r:
            continue
        rec = _score_recency(r["date_posted"], decay_days)
        loc = _score_location(r["location"], remote_bonus)
        total = w_sem * float(sem01[i]) + w_rec * rec + w_loc * loc
        items.append(
            RankedItem(
                id=int(jid),
                score=total,
                semantic=float(sem01[i]),
                recency=rec,
                location=loc,
                title=str(r["title"]),
                company=str(r["company"]),
                location_str=(r["location"] or None),
                date_posted=(r["date_posted"] or None),
                url=str(r["url"]),
            )
        )

    items.sort(key=lambda x: x.score, reverse=True)
    return items[:top]


def main(argv: Optional[Sequence[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Rank jobs by combined semantic + metadata score")
    parser.add_argument("--q", required=True, help="Query text")
    parser.add_argument("--k", type=int, default=50, help="Candidate pool from FAISS")
    parser.add_argument("--top", type=int, default=10, help="Top-N to return")
    args = parser.parse_args(argv)
    setup_logging()
    results = rank(args.q, k=args.k, top=args.top)
    for r in results:
        print(f"{r.score:.3f} | {r.title} — {r.company} | {r.location_str or 'N/A'} | {r.date_posted or 'N/A'}")
        print(f"  sem={r.semantic:.3f} rec={r.recency:.3f} loc={r.location:.3f}  {r.url}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

