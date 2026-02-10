import logging
from typing import Any

import firebase_admin
from firebase_admin import credentials, firestore

from app.config import settings

logger = logging.getLogger(__name__)

_db = None
_fallback: dict[str, dict[str, Any]] = {}
_use_fallback = False


def _init() -> None:
    global _db, _use_fallback

    if firebase_admin._apps:
        _db = firestore.client()
        return

    path = settings.firebase_service_account_path
    if not path:
        logger.warning("FIREBASE_SERVICE_ACCOUNT_PATH not set — using in-memory fallback")
        _use_fallback = True
        return

    cred = credentials.Certificate(path)
    firebase_admin.initialize_app(cred, {
        "projectId": settings.google_cloud_project or None,
    })
    _db = firestore.client()
    logger.info("Firestore initialized")


_init()


# ── generic helpers ──────────────────────────────────────────────

def save_document(collection: str, doc_id: str, data: dict) -> None:
    if _use_fallback:
        _fallback.setdefault(collection, {})[doc_id] = data
        return
    _db.collection(collection).document(doc_id).set(data)


def get_document(collection: str, doc_id: str) -> dict | None:
    if _use_fallback:
        return _fallback.get(collection, {}).get(doc_id)
    doc = _db.collection(collection).document(doc_id).get()
    return doc.to_dict() if doc.exists else None


def list_documents(collection: str) -> list[dict]:
    if _use_fallback:
        return list(_fallback.get(collection, {}).values())
    docs = _db.collection(collection).stream()
    return [doc.to_dict() for doc in docs]


def update_document(collection: str, doc_id: str, data: dict) -> None:
    if _use_fallback:
        existing = _fallback.get(collection, {}).get(doc_id)
        if existing is not None:
            existing.update(data)
        return
    _db.collection(collection).document(doc_id).update(data)


# ── debug helpers (fallback mode only) ───────────────────────────

def is_fallback_mode() -> bool:
    return _use_fallback


def debug_list_collection(collection: str) -> dict[str, Any]:
    """Return all doc IDs in a fallback collection. No-op in Firestore mode."""
    if not _use_fallback:
        return {}
    return _fallback.get(collection, {})


def debug_clear_all() -> None:
    """Clear all in-memory fallback data. No-op in Firestore mode."""
    if not _use_fallback:
        return
    _fallback.clear()
