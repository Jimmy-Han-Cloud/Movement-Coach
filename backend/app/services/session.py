import uuid
from datetime import datetime, timezone

from app.models.session import (
    PhaseResult,
    Session,
    SessionStatus,
)
from app.services.firestore import get_document, save_document, update_document

COLLECTION = "sessions"


def _session_to_dict(session: Session) -> dict:
    data = session.model_dump()
    data["created_at"] = data["created_at"].isoformat()
    if data["completed_at"]:
        data["completed_at"] = data["completed_at"].isoformat()
    return data


def _dict_to_session(data: dict) -> Session:
    return Session(**data)


def create_session(flow_id: str, user_id: str) -> Session:
    session_id = uuid.uuid4().hex[:12]
    session = Session(
        session_id=session_id,
        flow_id=flow_id,
        user_id=user_id,
        status=SessionStatus.STARTED,
        created_at=datetime.now(timezone.utc),
    )
    save_document(COLLECTION, session_id, _session_to_dict(session))
    return session


def submit_result(
    session_id: str,
    phase_results: list[PhaseResult],
    duration_actual_sec: float,
) -> Session | None:
    session = get_session(session_id)
    if session is None:
        return None
    completed_at = datetime.now(timezone.utc)
    update_data = {
        "status": SessionStatus.COMPLETED.value,
        "completed_at": completed_at.isoformat(),
        "phase_results": [r.model_dump() for r in phase_results],
        "duration_actual_sec": duration_actual_sec,
    }
    update_document(COLLECTION, session_id, update_data)
    session.status = SessionStatus.COMPLETED
    session.completed_at = completed_at
    session.phase_results = phase_results
    session.duration_actual_sec = duration_actual_sec
    return session


def save_summary(session_id: str, summary: str) -> Session | None:
    session = get_session(session_id)
    if session is None:
        return None
    update_document(COLLECTION, session_id, {"summary": summary})
    session.summary = summary
    return session


def get_session(session_id: str) -> Session | None:
    data = get_document(COLLECTION, session_id)
    if data is None:
        return None
    return _dict_to_session(data)
