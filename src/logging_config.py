"""Basic logging setup for AURA with rotating file logs.

Environment variables:
- LOG_LEVEL: e.g., INFO, DEBUG, or numeric (20)
- LOG_FORMAT: override log message format
- LOG_DATEFMT: override date format
- LOG_FILE: if set, log to this path (overrides default)
- LOG_MAX_BYTES: rotate after this size (bytes), default 5MB
- LOG_BACKUP_COUNT: number of rotated files to keep (default 3)
"""

from __future__ import annotations

import logging
import os
from logging.handlers import RotatingFileHandler
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

    # Handlers: always console; optional file (rotating)
    handlers: list[logging.Handler] = []
    console = logging.StreamHandler()
    console.setFormatter(logging.Formatter(fmt=fmt, datefmt=datefmt))
    handlers.append(console)

    # Resolve log file path
    log_file = os.getenv("LOG_FILE")
    if not log_file:
        # Default to logs/aura.log from config paths if available
        try:
            from .config import load_config  # local import to avoid early import cycles

            cfg = load_config()
            logs_dir = Path(cfg["paths"]["logs_dir"]).resolve()
        except Exception:
            logs_dir = Path("./logs").resolve()
        logs_dir.mkdir(parents=True, exist_ok=True)
        log_file = str(logs_dir / "aura.log")

    # Rotating file handler
    try:
        max_bytes = int(os.getenv("LOG_MAX_BYTES") or 5 * 1024 * 1024)
        backup_count = int(os.getenv("LOG_BACKUP_COUNT") or 3)
        p = Path(log_file)
        p.parent.mkdir(parents=True, exist_ok=True)
        file_h = RotatingFileHandler(p, maxBytes=max_bytes, backupCount=backup_count, encoding="utf-8")
        file_h.setFormatter(logging.Formatter(fmt=fmt, datefmt=datefmt))
        handlers.append(file_h)
    except Exception:
        # Fallback silently to console-only if file handler fails
        pass

    logging.basicConfig(level=numeric_level, handlers=handlers, force=True)
    logging.captureWarnings(True)

    # Tame noisy third-party loggers
    for noisy in ("urllib3", "sentence_transformers", "faiss", "torch", "uvicorn", "uvicorn.error", "uvicorn.access"):
        logging.getLogger(noisy).setLevel(max(logging.WARNING, numeric_level))
