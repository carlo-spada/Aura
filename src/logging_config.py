"""Basic logging setup for AURA.

Reads LOG_LEVEL and APP_ENV from environment and configures a
human-friendly format by default.
"""

from __future__ import annotations

import logging
import os


DEFAULT_FORMAT = "%(asctime)s | %(levelname)s | %(name)s | %(message)s"


def setup_logging(level: str | None = None) -> None:
    lvl = (level or os.getenv("LOG_LEVEL") or "INFO").upper()
    fmt = os.getenv("LOG_FORMAT") or DEFAULT_FORMAT
    try:
        numeric_level = getattr(logging, lvl)
    except AttributeError:
        numeric_level = logging.INFO

    logging.basicConfig(level=numeric_level, format=fmt)

