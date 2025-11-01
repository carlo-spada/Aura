"""Embedding engine wrapper for Sentence-Transformers.

Provides a thin facade so it can be swapped or fine-tuned later.
"""

from __future__ import annotations

from typing import List

import numpy as np


def encode_jobs(texts: List[str]) -> np.ndarray:
    """Placeholder encoder returning zero vectors.

    Replace with SentenceTransformers model and caching as needed.
    """
    if not texts:
        return np.zeros((0, 384), dtype=np.float32)
    return np.zeros((len(texts), 384), dtype=np.float32)

