from pydantic import BaseModel, Field

from app.models.phase_template import TempoLevel


class FlowGenerateRequest(BaseModel):
    duration_sec: int = Field(ge=60, le=600)
    tempo: TempoLevel
    seed: int | None = None
