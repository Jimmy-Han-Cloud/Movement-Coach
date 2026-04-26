from pydantic import BaseModel, Field

from app.models.phase_template import TempoLevel


class EnergySegment(BaseModel):
    start_sec: int
    end_sec: int
    energy: float = Field(ge=0.0, le=1.0)


class MusicAnalyzeRequest(BaseModel):
    song_name: str
    artist: str = ""
    duration_sec: int = Field(ge=30, le=600)
    bpm: int | None = Field(default=None, ge=40, le=220)
    energy: float | None = Field(default=None, ge=0.0, le=1.0)
    energy_timeline: list[EnergySegment] | None = None
    song_id: str | None = None  # preset songs only — used as cache key


class MusicAnalysis(BaseModel):
    song_name: str
    duration_sec: int
    tempo_level: TempoLevel
    estimated_bpm: int
    energy: float = Field(ge=0.0, le=1.0)
    reasoning: str
