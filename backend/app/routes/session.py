from fastapi import APIRouter, Depends, HTTPException

from app.models.session import (
    Session,
    SessionCreateRequest,
    SessionCreateResponse,
    SessionResultRequest,
)
from app.services.auth import get_current_user
from app.services.flow import get_flow
from app.services.gemini import generate_summary, is_available as gemini_available
from app.services.session import create_session, get_session, save_summary, submit_result

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.post("", response_model=SessionCreateResponse, status_code=201)
def start_session(body: SessionCreateRequest, user_id: str = Depends(get_current_user)):
    if get_flow(body.flow_id) is None:
        raise HTTPException(status_code=404, detail="Flow not found")
    session = create_session(flow_id=body.flow_id, user_id=user_id)
    return session


@router.post("/{session_id}/result", response_model=Session)
def post_result(
    session_id: str,
    body: SessionResultRequest,
    user_id: str = Depends(get_current_user),
):
    session = get_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not your session")
    if session.status == "completed":
        raise HTTPException(status_code=409, detail="Session already completed")
    updated = submit_result(
        session_id=session_id,
        phase_results=body.phase_results,
        duration_actual_sec=body.duration_actual_sec,
    )
    return updated


@router.post("/{session_id}/summary", response_model=Session)
def request_summary(session_id: str, user_id: str = Depends(get_current_user)):
    if not gemini_available():
        raise HTTPException(status_code=503, detail="Summary service unavailable")
    session = get_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not your session")
    if session.status != "completed":
        raise HTTPException(status_code=409, detail="Session not yet completed")
    if session.summary is not None:
        return session
    summary_text = generate_summary(session.phase_results, session.duration_actual_sec or 0)
    return save_summary(session_id, summary_text)


@router.get("/{session_id}", response_model=Session)
def read_session(session_id: str, user_id: str = Depends(get_current_user)):
    session = get_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not your session")
    return session
