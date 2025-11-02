from __future__ import annotations

import os
from typing import Optional

from fastapi import Depends, HTTPException, Request
from fastapi import status as http_status
from jose import JWTError, jwt


ALGORITHM = "HS256"


def decode_bearer(token: str) -> Optional[dict]:
    secret = os.getenv("NEXTAUTH_SECRET") or os.getenv("AUTH_SECRET")
    if not secret:
        return None
    try:
        data = jwt.decode(token, secret, algorithms=[ALGORITHM])
        return data
    except JWTError:
        return None


def get_current_user(request: Request) -> dict:
    """Decode NextAuth JWT from Authorization: Bearer <token>.

    Returns claims dict or raises 401 if invalid when header is present.
    If no header and no secret configured, allows anonymous (feature toggle).
    """
    auth = request.headers.get("Authorization")
    if not auth:
        # Allow anonymous if no token (public endpoints)
        return {}
    parts = auth.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=http_status.HTTP_401_UNAUTHORIZED, detail="Invalid auth header")
    claims = decode_bearer(parts[1])
    if not claims:
        raise HTTPException(status_code=http_status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    return claims

