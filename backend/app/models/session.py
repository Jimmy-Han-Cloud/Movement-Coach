from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class SessionStatus(str, Enum):
    STARTED = "started"
    COMPLETED = "completed"


class PhaseQuality(str, Enum):
    OK = "ok"
    PARTIAL = "partial"
    MISSED = "missed"


class PhaseResult(BaseModel):
    phase_index: int
    phase_name: str
    participation: bool
    hold_achieved: bool | None = None
    elbow_participation: bool | None = None
    quality: PhaseQuality = PhaseQuality.MISSED
    notes: str = ""


class SessionCreateRequest(BaseModel):
    flow_id: str


class SessionCreateResponse(BaseModel):
    session_id: str
    flow_id: str
    status: SessionStatus
    created_at: datetime


class SessionResultRequest(BaseModel):
    phase_results: list[PhaseResult]
    duration_actual_sec: float


class Session(BaseModel):
    session_id: str
    flow_id: str
    user_id: str
    status: SessionStatus
    created_at: datetime
    completed_at: datetime | None = None
    phase_results: list[PhaseResult] = []
    duration_actual_sec: float | None = None
    summary: str | None = None
