"""Basic logging setup for AURA.

Environment variables:
- LOG_LEVEL: e.g., INFO, DEBUG, or numeric (20)
- LOG_FORMAT: override log message format
- LOG_DATEFMT: override date format
- LOG_FILE: if set, also log to this file (alongside console)
"""

from __future__ import annotations

import logging
import os
from pathlib import Path


DEFAULT_FORMAT = "%(asctime)s | %(levelname)s | %(name)s | %(message)s"


def setup_logging(level: str | None = None) -> None:
    raw = (level or os.getenv("LOG_LEVEL") or "INFO").strip()
    fmt = os.getenv("LOG_FORMAT") or DEFAULT_FORMAT
    datefmt = os.getenv("LOG_DATEFMT") or None

    # Parse level (support names and numbers)
    numeric_level: int
    if raw.isdigit():
        numeric_level = int(raw)
    else:
        try:
            numeric_level = int(getattr(logging, raw.upper()))
        except Exception:
            numeric_level = logging.INFO

    # Handlers: always console; optional file if LOG_FILE provided
    handlers: list[logging.Handler] = []
    console = logging.StreamHandler()
    console.setFormatter(logging.Formatter(fmt=fmt, datefmt=datefmt))
    handlers.append(console)

    log_file = os.getenv("LOG_FILE")
    if log_file:
        try:
            p = Path(log_file)
            p.parent.mkdir(parents=True, exist_ok=True)
            file_h = logging.FileHandler(p, encoding="utf-8")
            file_h.setFormatter(logging.Formatter(fmt=fmt, datefmt=datefmt))
            handlers.append(file_h)
        except Exception:
            # Fallback silently to console-only if file handler fails
            pass

    logging.basicConfig(level=numeric_level, handlers=handlers, force=True)
    logging.captureWarnings(True)

    # Tame noisy third-party loggers
    for noisy in ("urllib3", "sentence_transformers", "faiss", "torch"):
        logging.getLogger(noisy).setLevel(max(logging.WARNING, numeric_level))
