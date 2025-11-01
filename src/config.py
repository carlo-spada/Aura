"""Configuration loader for AURA.

Reads `config.yaml` from the repository root and exposes a dict-like
configuration object with default fallbacks for required paths.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict

import yaml

DEFAULTS: Dict[str, Any] = {
    "paths": {
        "data_dir": "./data",
        "models_dir": "./models",
        "outputs_dir": "./outputs",
        "logs_dir": "./logs",
    },
    "ranking": {
        "weights": {
            "semantic": 0.7,
            "recency": 0.25,
            "location": 0.05,
        },
        "decay_days": 30,
        "remote_bonus": 1.0,
    },
}


def deep_merge(a: dict, b: dict) -> dict:
    out = dict(a)
    for k, v in b.items():
        if isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k] = deep_merge(out[k], v)
        else:
            out[k] = v
    return out


def load_config(path: str | Path = "config.yaml") -> Dict[str, Any]:
    p = Path(path)
    if p.exists():
        data = yaml.safe_load(p.read_text()) or {}
    else:
        data = {}
    return deep_merge(DEFAULTS, data)
