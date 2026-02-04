from enum import Enum

from pydantic import BaseModel


class PhaseType(str, Enum):
    NEUTRAL = "neutral"
    POSE_HOLD = "pose_hold"
    HAND_MOTION = "hand_motion"


class TrackedPoint(str, Enum):
    HEAD = "head"
    LEFT_SHOULDER = "left_shoulder"
    RIGHT_SHOULDER = "right_shoulder"
    LEFT_ELBOW = "left_elbow"
    RIGHT_ELBOW = "right_elbow"
    LEFT_HAND = "left_hand"
    RIGHT_HAND = "right_hand"


class Phase(BaseModel):
    index: int
    name: str
    phase_type: PhaseType
    start_sec: float
    end_sec: float
    tracked_points: list[TrackedPoint]
    description: str


class Flow(BaseModel):
    flow_id: str
    name: str
    duration_sec: float
    phases: list[Phase]
