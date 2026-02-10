import hashlib
import logging
import random

from app.models.flow import Flow, Phase, PhaseType, TrackedPoint
from app.models.phase_template import AnchorGroup, PhaseTemplate, TempoLevel
from app.services.phase_template import SEED_TEMPLATES, list_phase_templates

logger = logging.getLogger(__name__)

# ── Anchor → TrackedPoint expansion ──────────────────────────────

ANCHOR_MAP: dict[AnchorGroup, list[TrackedPoint]] = {
    AnchorGroup.HEAD: [TrackedPoint.HEAD],
    AnchorGroup.SHOULDER: [TrackedPoint.LEFT_SHOULDER, TrackedPoint.RIGHT_SHOULDER],
    AnchorGroup.ELBOW: [TrackedPoint.LEFT_ELBOW, TrackedPoint.RIGHT_ELBOW],
    AnchorGroup.HAND: [TrackedPoint.LEFT_HAND, TrackedPoint.RIGHT_HAND],
}


def _expand_anchors(anchors: list[AnchorGroup]) -> list[TrackedPoint]:
    seen: set[TrackedPoint] = set()
    result: list[TrackedPoint] = []
    for ag in anchors:
        for tp in ANCHOR_MAP[ag]:
            if tp not in seen:
                seen.add(tp)
                result.append(tp)
    return result


# ── Human-readable name from template ID ─────────────────────────

def _humanize(template_id: str) -> str:
    """Convert template ID to a human-readable name.

    e.g. 'pose_shoulder_drop_neck_lift' → 'Shoulder Drop & Neck Lift'
    """
    # Strip known prefixes
    for prefix in ("pose_", "motion_", "neutral_"):
        if template_id.startswith(prefix):
            template_id = template_id[len(prefix):]
            break
    return template_id.replace("_", " ").title().replace(" And ", " & ")


# ── Template selection ───────────────────────────────────────────

def _load_templates() -> list[PhaseTemplate]:
    """Load templates from Firestore, falling back to SEED_TEMPLATES."""
    templates = list_phase_templates()
    if not templates:
        logger.warning("No templates in Firestore — using SEED_TEMPLATES")
        return list(SEED_TEMPLATES)
    return templates


def _pick_template(
    templates: list[PhaseTemplate],
    phase_type: PhaseType,
    tempo: TempoLevel,
    last_id: str | None,
    rng: random.Random,
) -> PhaseTemplate:
    """Select a template matching type and tempo, avoiding repeats."""
    # Filter by type
    by_type = [t for t in templates if t.type == phase_type]
    if not by_type:
        raise ValueError(f"No templates of type {phase_type}")

    # Exclude last-used (if more than 1 option)
    candidates = [t for t in by_type if t.id != last_id] if len(by_type) > 1 else by_type

    # Prefer tempo match
    tempo_match = [t for t in candidates if tempo in t.tempo_profile]
    if tempo_match:
        return rng.choice(tempo_match)

    # Fallback: try "medium"
    medium_match = [t for t in candidates if TempoLevel.MEDIUM in t.tempo_profile]
    if medium_match:
        return rng.choice(medium_match)

    # Last resort: any candidate
    return rng.choice(candidates)


# ── Core generation ──────────────────────────────────────────────

_OPEN_NEUTRAL_BASE = 12.0
_CLOSE_NEUTRAL_BASE = 10.0
_PAIR_BUDGET_REF = 49.0  # reference pair duration from 180s flow
_PH_RATIO = 0.56
_HM_RATIO = 0.44
_PH_MIN, _PH_MAX = 20.0, 35.0
_HM_MIN, _HM_MAX = 15.0, 30.0
_PAIRS_MIN, _PAIRS_MAX = 1, 12


def _compute_pair_timing(core_budget: float, num_pairs: int):
    pair_budget = core_budget / num_pairs
    ph_dur = max(_PH_MIN, min(_PH_MAX, round(pair_budget * _PH_RATIO)))
    hm_dur = max(_HM_MIN, min(_HM_MAX, round(pair_budget * _HM_RATIO)))
    return ph_dur, hm_dur


def generate_flow(duration_sec: int, tempo: TempoLevel, seed: int | None = None) -> Flow:
    rng = random.Random(seed)
    templates = _load_templates()

    # ── Duration allocation ──
    core_budget = duration_sec - _OPEN_NEUTRAL_BASE - _CLOSE_NEUTRAL_BASE
    num_pairs = max(_PAIRS_MIN, min(_PAIRS_MAX, round(core_budget / _PAIR_BUDGET_REF)))
    ph_dur, hm_dur = _compute_pair_timing(core_budget, num_pairs)

    # Safety: reduce pairs if clamped durations exceed budget
    while num_pairs > 1 and num_pairs * (ph_dur + hm_dur) > core_budget:
        num_pairs -= 1
        ph_dur, hm_dur = _compute_pair_timing(core_budget, num_pairs)

    actual_core = num_pairs * (ph_dur + hm_dur)

    # Absorb remainder into opening neutral
    open_neutral_dur = round(duration_sec - actual_core - _CLOSE_NEUTRAL_BASE, 1)
    close_neutral_dur = _CLOSE_NEUTRAL_BASE

    # ── Build phases ──
    phases: list[Phase] = []
    cursor = 0.0
    idx = 0

    # Opening neutral
    open_tmpl = _pick_template(templates, PhaseType.NEUTRAL, tempo, None, rng)
    phases.append(Phase(
        index=idx,
        name="Calibration",
        phase_type=PhaseType.NEUTRAL,
        start_sec=cursor,
        end_sec=round(cursor + open_neutral_dur, 1),
        tracked_points=[
            TrackedPoint.HEAD,
            TrackedPoint.LEFT_SHOULDER,
            TrackedPoint.RIGHT_SHOULDER,
            TrackedPoint.LEFT_ELBOW,
            TrackedPoint.RIGHT_ELBOW,
        ],
        description=open_tmpl.intent,
    ))
    cursor = round(cursor + open_neutral_dur, 1)
    idx += 1

    last_ph_id: str | None = None
    last_hm_id: str | None = None

    for pair_i in range(num_pairs):
        # Pose Hold
        ph_tmpl = _pick_template(templates, PhaseType.POSE_HOLD, tempo, last_ph_id, rng)
        last_ph_id = ph_tmpl.id
        ph_end = round(cursor + ph_dur, 1)
        phases.append(Phase(
            index=idx,
            name=_humanize(ph_tmpl.id),
            phase_type=PhaseType.POSE_HOLD,
            start_sec=cursor,
            end_sec=ph_end,
            tracked_points=_expand_anchors(ph_tmpl.primary_anchors),
            description=ph_tmpl.intent,
        ))
        cursor = ph_end
        idx += 1

        # Hand Motion
        hm_tmpl = _pick_template(templates, PhaseType.HAND_MOTION, tempo, last_hm_id, rng)
        last_hm_id = hm_tmpl.id
        hm_end = round(cursor + hm_dur, 1)
        # Force last pair's HM to end exactly at duration - close_neutral
        if pair_i == num_pairs - 1:
            hm_end = round(duration_sec - close_neutral_dur, 1)
        phases.append(Phase(
            index=idx,
            name=_humanize(hm_tmpl.id),
            phase_type=PhaseType.HAND_MOTION,
            start_sec=cursor,
            end_sec=hm_end,
            tracked_points=_expand_anchors(hm_tmpl.primary_anchors),
            description=hm_tmpl.intent,
        ))
        cursor = hm_end
        idx += 1

    # Closing neutral
    close_tmpl = _pick_template(templates, PhaseType.NEUTRAL, tempo, open_tmpl.id, rng)
    phases.append(Phase(
        index=idx,
        name="Neutral End",
        phase_type=PhaseType.NEUTRAL,
        start_sec=cursor,
        end_sec=float(duration_sec),
        tracked_points=[],
        description=close_tmpl.intent,
    ))

    # ── Flow ID ──
    hex_suffix = hashlib.md5(
        f"{duration_sec}-{tempo}-{seed}".encode()
    ).hexdigest()[:4]
    flow_id = f"gen-{duration_sec}s-{tempo.value}-{hex_suffix}"

    return Flow(
        flow_id=flow_id,
        name=f"Generated {duration_sec}s {tempo.value} flow",
        duration_sec=float(duration_sec),
        phases=phases,
    )
