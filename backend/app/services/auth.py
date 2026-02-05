import logging

from fastapi import Depends, HTTPException, Request
from firebase_admin import auth

from app.config import settings

logger = logging.getLogger(__name__)


def get_current_user(request: Request) -> str:
    """Extract and verify user identity from the request.

    In debug mode, accepts X-Debug-User-Id header.
    In production, verifies Firebase ID token from Authorization header.
    """
    if settings.debug:
        debug_uid = request.headers.get("x-debug-user-id")
        if debug_uid:
            return debug_uid

    authorization = request.headers.get("authorization")
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = authorization.removeprefix("Bearer ")
    try:
        decoded = auth.verify_id_token(token)
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    uid: str = decoded["uid"]
    return uid
