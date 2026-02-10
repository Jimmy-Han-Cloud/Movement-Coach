from enum import Enum

from pydantic import BaseModel

from app.models.flow import PhaseType


class TempoLevel(str, Enum):
    SLOW = "slow"
    MEDIUM = "medium"
    FAST = "fast"


class AnchorGroup(str, Enum):
    """Template-level anchor grouping.
    Expanded to specific TrackedPoints (left_/right_) at Flow generation time.
    """

    HEAD = "head"
    SHOULDER = "shoulder"
    ELBOW = "elbow"
    HAND = "hand"


class BodyConstraints(BaseModel):
    posture: str = "seated"
    hand_out_of_frame_allowed: bool | None = None
    max_arm_height: str | None = None


class PhaseTemplate(BaseModel):
    id: str
    type: PhaseType
    beats_required: int
    tempo_profile: list[TempoLevel]
    body_constraints: BodyConstraints
    primary_anchors: list[AnchorGroup]
    intent: str
    verification_notes: list[str]
    status: str = "active"
    version: int = 1
