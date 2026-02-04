from fastapi import APIRouter

from app.services.firestore import _fallback, _use_fallback

router = APIRouter(prefix="/debug", tags=["debug"])


@router.get("/sessions")
def list_all_sessions():
    if not _use_fallback:
        return {"detail": "Debug listing only available with in-memory fallback"}
    sessions = _fallback.get("sessions", {})
    return {"count": len(sessions), "session_ids": list(sessions.keys())}


@router.get("/user-params")
def list_all_user_params():
    if not _use_fallback:
        return {"detail": "Debug listing only available with in-memory fallback"}
    params = _fallback.get("user_params", {})
    return {"count": len(params), "user_ids": list(params.keys())}


@router.post("/reset")
def reset_all_data():
    if not _use_fallback:
        return {"detail": "Reset only available with in-memory fallback"}
    _fallback.clear()
    return {"status": "cleared"}
