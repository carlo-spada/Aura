"""Generate tailored CVs and Cover Letters (stub)."""

from __future__ import annotations

from pathlib import Path


def generate_application(output_dir: str | Path) -> None:
    """Placeholder: render markdown and export PDFs to outputs dir."""
    Path(output_dir).mkdir(parents=True, exist_ok=True)

