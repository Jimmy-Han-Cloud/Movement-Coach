from app.models.flow import Flow, Phase, PhaseType, TrackedPoint

TP = TrackedPoint

BODY_POINTS = [TP.HEAD, TP.LEFT_SHOULDER, TP.RIGHT_SHOULDER, TP.LEFT_ELBOW, TP.RIGHT_ELBOW]
HAND_AND_ELBOW = [TP.LEFT_HAND, TP.RIGHT_HAND, TP.LEFT_ELBOW, TP.RIGHT_ELBOW]
UPPER_BODY = [TP.HEAD, TP.LEFT_SHOULDER, TP.RIGHT_SHOULDER, TP.LEFT_ELBOW, TP.RIGHT_ELBOW]

FLOWS: dict[str, Flow] = {
    "3min-standard": Flow(
        flow_id="3min-standard",
        name="3-Minute Standard Session",
        duration_sec=180,
        phases=[
            Phase(
                index=0,
                name="Calibration",
                phase_type=PhaseType.NEUTRAL,
                start_sec=0,
                end_sec=15,
                tracked_points=UPPER_BODY,
                description="Establish personal baseline",
            ),
            Phase(
                index=1,
                name="Neck Release",
                phase_type=PhaseType.POSE_HOLD,
                start_sec=15,
                end_sec=45,
                tracked_points=UPPER_BODY,
                description="Neck mobility and release",
            ),
            Phase(
                index=2,
                name="Light Rhythm",
                phase_type=PhaseType.HAND_MOTION,
                start_sec=45,
                end_sec=65,
                tracked_points=HAND_AND_ELBOW,
                description="Arm wake-up",
            ),
            Phase(
                index=3,
                name="Shoulder + Elbow Open",
                phase_type=PhaseType.POSE_HOLD,
                start_sec=65,
                end_sec=95,
                tracked_points=UPPER_BODY,
                description="Core shoulder engagement",
            ),
            Phase(
                index=4,
                name="Flowing Arms",
                phase_type=PhaseType.HAND_MOTION,
                start_sec=95,
                end_sec=115,
                tracked_points=HAND_AND_ELBOW,
                description="Coordinated arm movement",
            ),
            Phase(
                index=5,
                name="Integrated Reset",
                phase_type=PhaseType.POSE_HOLD,
                start_sec=115,
                end_sec=145,
                tracked_points=UPPER_BODY,
                description="Upper-body integration",
            ),
            Phase(
                index=6,
                name="Gentle Rhythm Close",
                phase_type=PhaseType.HAND_MOTION,
                start_sec=145,
                end_sec=170,
                tracked_points=HAND_AND_ELBOW,
                description="Rhythmic cooldown",
            ),
            Phase(
                index=7,
                name="Neutral End",
                phase_type=PhaseType.NEUTRAL,
                start_sec=170,
                end_sec=180,
                tracked_points=[],
                description="Return to rest",
            ),
        ],
    ),
}


def get_flow(flow_id: str) -> Flow | None:
    return FLOWS.get(flow_id)


def list_flow_ids() -> list[str]:
    return list(FLOWS.keys())
