from fastapi import APIRouter

from app.services.firestore import debug_clear_all, debug_list_collection, is_fallback_mode

router = APIRouter(prefix="/debug", tags=["debug"])


@router.get("/sessions")
def list_all_sessions():
    if not is_fallback_mode():
        return {"detail": "Debug listing only available with in-memory fallback"}
    sessions = debug_list_collection("sessions")
    return {"count": len(sessions), "session_ids": list(sessions.keys())}


@router.get("/user-params")
def list_all_user_params():
    if not is_fallback_mode():
        return {"detail": "Debug listing only available with in-memory fallback"}
    params = debug_list_collection("user_params")
    return {"count": len(params), "user_ids": list(params.keys())}


@router.post("/reset")
def reset_all_data():
    if not is_fallback_mode():
        return {"detail": "Reset only available with in-memory fallback"}
    debug_clear_all()
    return {"status": "cleared"}
