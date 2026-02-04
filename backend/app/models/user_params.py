from pydantic import BaseModel, Field


class UserParams(BaseModel):
    pose_hold_duration: float = Field(default=2.0, ge=1.5, le=3.0)
    positional_tolerance: float = Field(default=0.5, ge=0.3, le=0.8)
    elbow_participation_threshold: float = Field(default=0.4, ge=0.2, le=0.7)
    hand_motion_tempo: float = Field(default=1.0, ge=0.7, le=1.3)


class UserParamsUpdate(BaseModel):
    pose_hold_duration: float | None = Field(default=None, ge=1.5, le=3.0)
    positional_tolerance: float | None = Field(default=None, ge=0.3, le=0.8)
    elbow_participation_threshold: float | None = Field(default=None, ge=0.2, le=0.7)
    hand_motion_tempo: float | None = Field(default=None, ge=0.7, le=1.3)
