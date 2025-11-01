"""AURA bootstrap entrypoint.

Creates expected folders, ensures config can be loaded, and provides
stubs for the weekly workflow described in AURA_Specification.md.
"""

from __future__ import annotations

import json
import os
from pathlib import Path

from rich import print
import logging

from .logging_config import setup_logging

from .config import load_config


def ensure_dirs(paths: dict) -> None:
    for key in ("data_dir", "models_dir", "outputs_dir", "logs_dir"):
        d = Path(paths[key])
        d.mkdir(parents=True, exist_ok=True)

    # Seed metrics file if missing
    metrics_path = Path(paths["data_dir"]) / "metrics.json"
    if not metrics_path.exists():
        metrics_path.write_text(
            json.dumps(
                {
                    "avg_match_score": 0.0,
                    "avg_rating": 0.0,
                    "cumulative_reward": 0.0,
                    "skill_gap_index": 0.0,
                },
                indent=2,
            )
        )


def main() -> int:
    setup_logging()
    log = logging.getLogger("aura.main")
    cfg = load_config()
    ensure_dirs(cfg["paths"])

    log.info("AURA bootstrap ready.")
    print("[bold green]AURA[/bold green] bootstrap ready.")
    print("Config loaded from:", os.path.abspath("config.yaml"))
    print("Data directory:", cfg["paths"]["data_dir"]) 
    print("Outputs directory:", cfg["paths"]["outputs_dir"]) 

    print("\nNext actions:")
    print("- Initialize DB: python -m src.db.init_db")
    print("- Ingest RemoteOK jobs: python -m src.ingestion.remoteok --days 7")
    print("- Embed jobs: python -m src.embeddings.encoder embed")
    print("- Build FAISS index: python -m src.embeddings.encoder index")
    print("- Run dashboard stub: streamlit run src/dashboard/app.py")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
