from __future__ import annotations

import os
import time
from typing import Any, Dict, Optional

import httpx
from fastapi import Depends, HTTPException, Request
from jose import jwt


class JWKSCache:
    def __init__(self) -> None:
        self.keys: Optional[Dict[str, Any]] = None
        self.ts: float = 0.0

    def get(self) -> Dict[str, Any]:
        return self.keys or {}

    def set(self, keys: Dict[str, Any]) -> None:
        self.keys = keys
        self.ts = time.time()


_jwks_cache = JWKSCache()


def _fetch_jwks(jwks_url: str) -> Dict[str, Any]:
    # Simple 5-minute cache
    if _jwks_cache.keys and (time.time() - _jwks_cache.ts) < 300:
        return _jwks_cache.get()
    with httpx.Client(timeout=10) as client:
        resp = client.get(jwks_url)
        resp.raise_for_status()
        data = resp.json()
    _jwks_cache.set(data)
    return data


def verify_clerk_jwt(token: str) -> Dict[str, Any]:
    issuer = os.getenv("CLERK_ISSUER")
    jwks_url = os.getenv("CLERK_JWKS_URL")
    if not issuer or not jwks_url:
        raise HTTPException(status_code=500, detail="Clerk config missing")
    try:
        unverified = jwt.get_unverified_header(token)
        jwks = _fetch_jwks(jwks_url)
        for key in jwks.get("keys", []):
            if key.get("kid") == unverified.get("kid"):
                public_key = jwt.algorithms.RSAAlgorithm.from_jwk(key)  # type: ignore[attr-defined]
                payload = jwt.decode(
                    token,
                    key=public_key,
                    algorithms=[key.get("alg", "RS256")],
                    options={"verify_aud": False},  # audience optional
                    issuer=issuer,
                )
                return payload
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")
    raise HTTPException(status_code=401, detail="Unable to verify token")


def get_identity(req: Request) -> Dict[str, Any]:
    auth = req.headers.get("authorization") or req.headers.get("Authorization")
    if not auth or not auth.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = auth.split(" ", 1)[1]
    payload = verify_clerk_jwt(token)
    return payload

