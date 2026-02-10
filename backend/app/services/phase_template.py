import logging

from app.models.flow import PhaseType
from app.models.phase_template import (
    AnchorGroup,
    BodyConstraints,
    PhaseTemplate,
    TempoLevel,
)
from app.services.firestore import get_document, list_documents, save_document

logger = logging.getLogger(__name__)

COLLECTION = "phase_templates"

# ── 10 Phase Templates ──────────────────────────────────────────

SEED_TEMPLATES: list[PhaseTemplate] = [
    # ── Pose Hold (1-4): 4 beats, slow/medium ──
    PhaseTemplate(
        id="pose_shoulder_drop_neck_lift",
        type=PhaseType.POSE_HOLD,
        beats_required=4,
        tempo_profile=[TempoLevel.SLOW, TempoLevel.MEDIUM],
        body_constraints=BodyConstraints(
            posture="seated",
            hand_out_of_frame_allowed=True,
            max_arm_height="unlimited",
        ),
        primary_anchors=[AnchorGroup.SHOULDER, AnchorGroup.ELBOW],
        intent=(
            "Shoulders sink downward while the head gently elongates upward. "
            'No tilt, no rotation. Feels like "getting taller".'
        ),
        verification_notes=[
            "Head stays centered",
            "No side bending",
            "Calm, decompressive feeling",
        ],
    ),
    PhaseTemplate(
        id="pose_chest_open_bilateral",
        type=PhaseType.POSE_HOLD,
        beats_required=4,
        tempo_profile=[TempoLevel.SLOW, TempoLevel.MEDIUM],
        body_constraints=BodyConstraints(
            posture="seated",
            hand_out_of_frame_allowed=True,
            max_arm_height="shoulder_level",
        ),
        primary_anchors=[AnchorGroup.SHOULDER, AnchorGroup.ELBOW],
        intent=(
            "Arms move slightly backward, chest opens, shoulders gently retract. "
            "Calm and non-athletic."
        ),
        verification_notes=[
            "Arms do not need to go high",
            "Hands may leave frame",
            "No strain",
        ],
    ),
    PhaseTemplate(
        id="pose_shoulder_lift_release",
        type=PhaseType.POSE_HOLD,
        beats_required=4,
        tempo_profile=[TempoLevel.SLOW, TempoLevel.MEDIUM],
        body_constraints=BodyConstraints(
            posture="seated",
            hand_out_of_frame_allowed=True,
            max_arm_height="shoulder_level",
        ),
        primary_anchors=[AnchorGroup.SHOULDER],
        intent=(
            "Shoulders lift upward together, then release downward into relaxation. "
            "Relaxation comes from the drop, not the lift."
        ),
        verification_notes=[],
    ),
    PhaseTemplate(
        id="pose_elbow_overhead_reach",
        type=PhaseType.POSE_HOLD,
        beats_required=4,
        tempo_profile=[TempoLevel.SLOW, TempoLevel.MEDIUM],
        body_constraints=BodyConstraints(
            posture="seated",
            hand_out_of_frame_allowed=True,
            max_arm_height="overhead",
        ),
        primary_anchors=[AnchorGroup.SHOULDER, AnchorGroup.ELBOW],
        intent=(
            "Both arms lift upward and slightly backward, elbows reaching overhead. "
            "Chest opens. No torso rotation."
        ),
        verification_notes=[],
    ),
    # ── Hand Motion (5-8): 2 beats, medium/fast ──
    PhaseTemplate(
        id="motion_arm_diagonal_up_sweep",
        type=PhaseType.HAND_MOTION,
        beats_required=2,
        tempo_profile=[TempoLevel.MEDIUM, TempoLevel.FAST],
        body_constraints=BodyConstraints(
            posture="seated",
            hand_out_of_frame_allowed=False,
            max_arm_height="head_level",
        ),
        primary_anchors=[AnchorGroup.HAND, AnchorGroup.ELBOW],
        intent=(
            "Both arms move in parallel diagonally upward. First toward upper-left, "
            "then upper-right. Arms may approach head level but do not pass over the head."
        ),
        verification_notes=[],
    ),
    PhaseTemplate(
        id="motion_arm_alternate_up_down",
        type=PhaseType.HAND_MOTION,
        beats_required=2,
        tempo_profile=[TempoLevel.MEDIUM, TempoLevel.FAST],
        body_constraints=BodyConstraints(
            posture="seated",
            hand_out_of_frame_allowed=False,
            max_arm_height="head_level",
        ),
        primary_anchors=[AnchorGroup.HAND, AnchorGroup.ELBOW],
        intent=(
            "With elbows near shoulder level, one arm moves up while the other moves down, "
            "then the motion reverses."
        ),
        verification_notes=[],
    ),
    PhaseTemplate(
        id="motion_arm_vertical_alternate",
        type=PhaseType.HAND_MOTION,
        beats_required=2,
        tempo_profile=[TempoLevel.MEDIUM, TempoLevel.FAST],
        body_constraints=BodyConstraints(
            posture="seated",
            hand_out_of_frame_allowed=False,
            max_arm_height="head_level",
        ),
        primary_anchors=[AnchorGroup.HAND, AnchorGroup.ELBOW],
        intent=(
            "Arms are vertical and parallel in front of the torso. "
            "One arm moves up while the other moves down, then reverse."
        ),
        verification_notes=[],
    ),
    PhaseTemplate(
        id="motion_arm_accented_circular_loop",
        type=PhaseType.HAND_MOTION,
        beats_required=2,
        tempo_profile=[TempoLevel.MEDIUM, TempoLevel.FAST],
        body_constraints=BodyConstraints(
            posture="seated",
            hand_out_of_frame_allowed=False,
            max_arm_height="head_level",
        ),
        primary_anchors=[AnchorGroup.HAND, AnchorGroup.ELBOW],
        intent=(
            "Hands accent upward twice, trace a circular path downward, "
            "then accent upward twice from the lower position. One continuous rhythmic loop."
        ),
        verification_notes=[],
    ),
    # ── Neutral (9-10): 2 beats, all tempos ──
    PhaseTemplate(
        id="neutral_reset_breath",
        type=PhaseType.NEUTRAL,
        beats_required=2,
        tempo_profile=[TempoLevel.SLOW, TempoLevel.MEDIUM, TempoLevel.FAST],
        body_constraints=BodyConstraints(posture="seated"),
        primary_anchors=[AnchorGroup.SHOULDER],
        intent="Stillness with a breathing cue. Visual pause between phases.",
        verification_notes=[],
    ),
    PhaseTemplate(
        id="neutral_shoulder_release",
        type=PhaseType.NEUTRAL,
        beats_required=2,
        tempo_profile=[TempoLevel.SLOW, TempoLevel.MEDIUM, TempoLevel.FAST],
        body_constraints=BodyConstraints(posture="seated"),
        primary_anchors=[AnchorGroup.SHOULDER],
        intent="Passive shoulder drop and micro release. No arm choreography.",
        verification_notes=[],
    ),
]


# ── CRUD ─────────────────────────────────────────────────────────

def seed_phase_templates() -> int:
    """Write all seed templates to Firestore. Returns count written."""
    count = 0
    for tmpl in SEED_TEMPLATES:
        save_document(COLLECTION, tmpl.id, tmpl.model_dump())
        count += 1
    logger.info("Seeded %d phase templates into Firestore", count)
    return count


def get_phase_template(template_id: str) -> PhaseTemplate | None:
    data = get_document(COLLECTION, template_id)
    if data is None:
        return None
    return PhaseTemplate(**data)


def list_phase_templates() -> list[PhaseTemplate]:
    docs = list_documents(COLLECTION)
    return [PhaseTemplate(**d) for d in docs]
