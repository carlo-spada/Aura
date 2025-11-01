"""AURA Dashboard: overview, job list, and semantic search."""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import List, Tuple

import numpy as np
import streamlit as st


st.set_page_config(page_title="AURA Dashboard", layout="wide")


def load_config():
    # Lazy import to avoid path issues if run outside Docker
    from src.config import load_config as _load

    return _load()


@st.cache_resource
def get_db_conn(db_path: Path) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


@st.cache_resource
def get_model(model_name: str):
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(model_name)


@st.cache_resource
def get_faiss_index(index_path: Path):
    import faiss  # type: ignore

    if not index_path.exists():
        return None
    return faiss.read_index(str(index_path))


def query_top_k(index, model, text: str, k: int = 10) -> Tuple[np.ndarray, np.ndarray]:
    import faiss  # type: ignore

    if not text.strip():
        return np.empty((0,)), np.empty((0,))
    vec = model.encode([text], convert_to_numpy=True, normalize_embeddings=False).astype(
        np.float32
    )
    # cosine via normalized inner product
    norm = np.linalg.norm(vec, axis=1, keepdims=True) + 1e-12
    vec = vec / norm
    D, I = index.search(vec, k)
    return D.ravel(), I.ravel().astype(int)


def fetch_jobs_by_ids(conn: sqlite3.Connection, ids: List[int]) -> List[sqlite3.Row]:
    if not ids:
        return []
    placeholders = ",".join(["?"] * len(ids))
    cur = conn.execute(
        f"SELECT id, title, company, location, date_posted, url FROM jobs WHERE id IN ({placeholders})",
        ids,
    )
    rows = cur.fetchall()
    # Preserve order as returned by FAISS ids
    order = {jid: i for i, jid in enumerate(ids)}
    return sorted(rows, key=lambda r: order.get(r["id"], 1_000_000))


cfg = load_config()
data_dir = Path(cfg["paths"]["data_dir"]).resolve()
db_path = data_dir / "jobs.db"
index_path = data_dir / "faiss.index"

st.title("AURA Dashboard")
cols = st.columns(3)

# Metrics (if present)
metrics_path = data_dir / "metrics.json"
if metrics_path.exists():
    try:
        metrics = json.loads(metrics_path.read_text())
        cols[0].metric("Avg Match Score", f"{metrics.get('avg_match_score', 0):.2f}")
        cols[1].metric("Avg Rating", f"{metrics.get('avg_rating', 0):.2f}")
        cols[2].metric("Cumulative Reward", f"{metrics.get('cumulative_reward', 0):.2f}")
    except Exception:
        pass

tab_overview, tab_jobs, tab_search = st.tabs(["Overview", "Jobs", "Search"])

with tab_overview:
    st.write("Use the tabs to browse ingested jobs or search semantically using the FAISS index.")
    st.markdown(
        "- Ingest: `python -m src.ingestion.remoteok --days 7`  ")
    st.markdown("- Embed: `python -m src.embeddings.encoder embed`")
    st.markdown("- Index: `python -m src.embeddings.encoder index`")

with tab_jobs:
    if not db_path.exists():
        st.warning("Database not found. Run the ingestion and DB init steps first.")
    else:
        conn = get_db_conn(db_path)
        cur = conn.execute(
            "SELECT id, title, company, location, date_posted, url FROM jobs ORDER BY date_posted DESC NULLS LAST, id DESC LIMIT 250"
        )
        rows = cur.fetchall()
        st.subheader(f"Jobs (showing {len(rows)} most recent)")
        if rows:
            data = [dict(r) for r in rows]
            st.dataframe(data, use_container_width=True)
        else:
            st.info("No jobs found. Try running the ingestion pipeline.")

with tab_search:
    if not db_path.exists():
        st.warning("Database not found. Run the ingestion and DB init steps first.")
    elif not index_path.exists():
        st.warning("FAISS index not found. Run the embeddings and index steps first.")
    else:
        model_name = cfg.get("models", {}).get("embedding", "sentence-transformers/all-MiniLM-L6-v2")
        model = get_model(model_name)
        index = get_faiss_index(index_path)
        if index is None:
            st.warning("Could not load FAISS index.")
        else:
            q = st.text_input("Search query", placeholder="e.g., data scientist NLP remote")
            k = st.slider("Top K", min_value=5, max_value=50, value=10, step=5)
            if q:
                scores, ids = query_top_k(index, model, q, k=k)
                conn = get_db_conn(db_path)
                rows = fetch_jobs_by_ids(conn, ids.tolist())
                st.subheader(f"Top {len(rows)} results")
                for row, score in zip(rows, scores):
                    st.markdown(
                        f"**{row['title']}** — {row['company']} | {row['location'] or 'N/A'}  ")
                    st.markdown(f"Score: `{score:.3f}` | [Job Link]({row['url']}) | Posted: {row['date_posted'] or 'N/A'}")
                    st.markdown("---")
