from app.models.flow import Flow, Phase, PhaseType, TrackedPoint

TP = TrackedPoint

BODY_POINTS = [TP.HEAD, TP.LEFT_SHOULDER, TP.RIGHT_SHOULDER, TP.LEFT_ELBOW, TP.RIGHT_ELBOW]
HAND_AND_ELBOW = [TP.LEFT_HAND, TP.RIGHT_HAND, TP.LEFT_ELBOW, TP.RIGHT_ELBOW]
UPPER_BODY = [TP.HEAD, TP.LEFT_SHOULDER, TP.RIGHT_SHOULDER, TP.LEFT_ELBOW, TP.RIGHT_ELBOW]

# 180s MEDIUM flow rebuilt with path-1 rules:
#   NEUTRAL(3s) → HM intro(9s) → [PH(10s) → HM(23s)] × 5 → NEUTRAL(3s)  total=180s
FLOWS: dict[str, Flow] = {
    "3min-standard": Flow(
        flow_id="3min-standard",
        name="3-Minute Standard Session",
        duration_sec=180,
        phases=[
            Phase(index=0, name="Calibration",
                  phase_type=PhaseType.NEUTRAL, start_sec=0, end_sec=3,
                  tracked_points=UPPER_BODY, description="Settle in and find your baseline"),
            # ── Intro motion (9s) ──────────────────────────────────────
            Phase(index=1, name="motion_arm_diagonal_up_sweep",
                  phase_type=PhaseType.HAND_MOTION, start_sec=3, end_sec=12,
                  tracked_points=HAND_AND_ELBOW, description="Arms sweep diagonally upward to wake up the body"),
            # ── Pair 1 ────────────────────────────────────────────────
            Phase(index=2, name="pose_shoulder_drop_neck_lift",
                  phase_type=PhaseType.POSE_HOLD, start_sec=12, end_sec=22,
                  tracked_points=UPPER_BODY, description="Shoulders sink down, head elongates upward"),
            Phase(index=3, name="motion_arm_alternate_up_down",
                  phase_type=PhaseType.HAND_MOTION, start_sec=22, end_sec=45,
                  tracked_points=HAND_AND_ELBOW, description="One arm up while the other goes down, alternating"),
            # ── Pair 2 ────────────────────────────────────────────────
            Phase(index=4, name="pose_chest_open_bilateral",
                  phase_type=PhaseType.POSE_HOLD, start_sec=45, end_sec=55,
                  tracked_points=UPPER_BODY, description="Arms back, chest opens, shoulders retract"),
            Phase(index=5, name="motion_arm_vertical_alternate",
                  phase_type=PhaseType.HAND_MOTION, start_sec=55, end_sec=78,
                  tracked_points=HAND_AND_ELBOW, description="Arms vertical, alternate up/down in front of torso"),
            # ── Pair 3 ────────────────────────────────────────────────
            Phase(index=6, name="pose_shoulder_lift_release",
                  phase_type=PhaseType.POSE_HOLD, start_sec=78, end_sec=88,
                  tracked_points=UPPER_BODY, description="Shoulders lift then release downward"),
            Phase(index=7, name="motion_arm_accented_circular_loop",
                  phase_type=PhaseType.HAND_MOTION, start_sec=88, end_sec=111,
                  tracked_points=HAND_AND_ELBOW, description="Hands accent upward twice then loop downward"),
            # ── Pair 4 ────────────────────────────────────────────────
            Phase(index=8, name="pose_elbow_overhead_reach",
                  phase_type=PhaseType.POSE_HOLD, start_sec=111, end_sec=121,
                  tracked_points=UPPER_BODY, description="Both arms lift overhead, chest opens"),
            Phase(index=9, name="motion_arm_diagonal_up_sweep",
                  phase_type=PhaseType.HAND_MOTION, start_sec=121, end_sec=144,
                  tracked_points=HAND_AND_ELBOW, description="Arms sweep diagonally upward"),
            # ── Pair 5 ────────────────────────────────────────────────
            Phase(index=10, name="pose_shoulder_drop_neck_lift",
                  phase_type=PhaseType.POSE_HOLD, start_sec=144, end_sec=154,
                  tracked_points=UPPER_BODY, description="Shoulders sink down, head elongates upward"),
            Phase(index=11, name="motion_arm_alternate_up_down",
                  phase_type=PhaseType.HAND_MOTION, start_sec=154, end_sec=177,
                  tracked_points=HAND_AND_ELBOW, description="One arm up while the other goes down, alternating"),
            # ── Close ─────────────────────────────────────────────────
            Phase(index=12, name="Neutral End",
                  phase_type=PhaseType.NEUTRAL, start_sec=177, end_sec=180,
                  tracked_points=[], description="Return to rest"),
        ],
    ),
}


def get_flow(flow_id: str) -> Flow | None:
    return FLOWS.get(flow_id)


def list_flow_ids() -> list[str]:
    return list(FLOWS.keys())
