"""AURA Dashboard: overview, job list, and semantic search."""

from __future__ import annotations

import json
from pathlib import Path
from typing import List, Tuple
import datetime as dt

import numpy as np
import streamlit as st
from src.db.session import get_session
from src.db.models import Job, Rating


st.set_page_config(page_title="AURA Dashboard", layout="wide")


def load_config():
    # Lazy import to avoid path issues if run outside Docker
    from src.config import load_config as _load

    return _load()


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


def fetch_jobs_by_ids(ids: List[int]):
    if not ids:
        return []
    with get_session() as session:
        rows = (
            session.query(Job.id, Job.title, Job.company, Job.location, Job.date_posted, Job.url)
            .filter(Job.id.in_(ids))
            .all()
        )
    order = {jid: i for i, jid in enumerate(ids)}
    rows = [
        {"id": int(r[0]), "title": r[1], "company": r[2], "location": r[3], "date_posted": r[4], "url": r[5]}
        for r in rows
    ]
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

tab_overview, tab_jobs, tab_search, tab_rank, tab_rate = st.tabs(["Overview", "Jobs", "Search", "Rank", "Rate"]) 

with tab_overview:
    st.write("Use the tabs to browse ingested jobs or search semantically using the FAISS index.")
    st.markdown(
        "- Ingest: `python -m src.ingestion.remoteok --days 7`  ")
    st.markdown("- Embed: `python -m src.embeddings.encoder embed`")
    st.markdown("- Index: `python -m src.embeddings.encoder index`")

with tab_jobs:
    with get_session() as session:
        rows = (
            session.query(Job.id, Job.title, Job.company, Job.location, Job.date_posted, Job.url)
            .order_by(Job.date_posted.desc().nullslast(), Job.id.desc())
            .limit(250)
            .all()
        )
    st.subheader(f"Jobs (showing {len(rows)} most recent)")
    if rows:
        data = [
            {"id": int(r[0]), "title": r[1], "company": r[2], "location": r[3], "date_posted": r[4], "url": r[5]}
            for r in rows
        ]
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
                rows = fetch_jobs_by_ids(ids.tolist())
                st.subheader(f"Top {len(rows)} results")
                for row, score in zip(rows, scores):
                    st.markdown(
                        f"**{row['title']}** — {row['company']} | {row['location'] or 'N/A'}  ")
                    st.markdown(f"Score: `{score:.3f}` | [Job Link]({row['url']}) | Posted: {row['date_posted'] or 'N/A'}")
                    st.markdown("---")

with tab_rank:
    cfg_local = load_config()
    if not (data_dir / "faiss.index").exists():
        st.warning("FAISS index not found. Run the embeddings and index steps first.")
    else:
        rq = st.text_input("Ranking query", placeholder="e.g., data scientist remote NLP")
        k = st.slider("Candidate pool (k)", min_value=20, max_value=200, value=50, step=10)
        topn = st.slider("Top N", min_value=5, max_value=50, value=10, step=5)
        if rq:
            # Lazy import to avoid circulars on streamlit reload
            from src.ranking.rank import rank as rank_fn

            items = rank_fn(rq, k=k, top=topn)
            st.subheader(f"Top {len(items)} ranked results")
            for it in items:
                st.markdown(
                    f"**{it.title}** — {it.company} | {it.location_str or 'N/A'}  ")
                st.markdown(
                    f"Score: `{it.score:.3f}` (sem={it.semantic:.3f}, rec={it.recency:.3f}, loc={it.location:.3f}) | [Job Link]({it.url}) | Posted: {it.date_posted or 'N/A'}"
                )
                st.markdown("---")

with tab_rate:
    with get_session() as session:
        jobs = (
            session.query(Job.id, Job.title, Job.company)
            .order_by(Job.date_posted.desc().nullslast(), Job.id.desc())
            .limit(200)
            .all()
        )
        if not jobs:
            st.info("No jobs available to rate.")
        else:
            job_options = {f"{j[1]} — {j[2]} (#{j[0]})": int(j[0]) for j in jobs}
            sel = st.selectbox("Select job to rate", list(job_options.keys()))
            job_id = job_options[sel]

            c1, c2 = st.columns(2)
            with c1:
                fit = st.slider("Fit score", 1, 10, 7)
                interest = st.slider("Interest score", 1, 10, 7)
            with c2:
                prestige = st.slider("Prestige score", 1, 10, 5)
                location = st.slider("Location score", 1, 10, 6)
            comment = st.text_area("Comment (optional)", "")
            if st.button("Submit rating"):
                try:
                    with get_session() as session:
                        session.add(
                            Rating(
                                job_id=int(job_id),
                                fit_score=int(fit),
                                interest_score=int(interest),
                                prestige_score=int(prestige),
                                location_score=int(location),
                                comment=(comment or "").strip() or None,
                                timestamp=dt.datetime.utcnow(),
                            )
                        )
                    st.success("Rating saved.")
                except Exception as e:
                    st.error(f"Failed to save rating: {e}")

        st.subheader("Recent ratings")
        with get_session() as session:
            rows = (
                session.query(
                    Rating.id.label("rating_id"),
                    Rating.timestamp,
                    Rating.fit_score,
                    Rating.interest_score,
                    Rating.prestige_score,
                    Rating.location_score,
                    Job.title,
                    Job.company,
                )
                .join(Job, Rating.job_id == Job.id)
                .order_by(Rating.timestamp.desc(), Rating.id.desc())
                .limit(50)
                .all()
            )
        if rows:
            st.dataframe([
                {
                    "rating_id": int(r[0]),
                    "timestamp": r[1],
                    "fit_score": r[2],
                    "interest_score": r[3],
                    "prestige_score": r[4],
                    "location_score": r[5],
                    "title": r[6],
                    "company": r[7],
                }
                for r in rows
            ], use_container_width=True)
        else:
            st.info("No ratings yet.")
