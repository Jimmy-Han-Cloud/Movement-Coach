import hashlib
import json
import logging
import random
import re

from app.models.flow import Flow, Phase, PhaseType, TrackedPoint
from app.models.phase_template import AnchorGroup, PhaseTemplate, TempoLevel
from app.services.gemini import _client as gemini_client
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


_MAX_CONSECUTIVE = 4


def _plan_sequence(
    templates: list[PhaseTemplate],
    phase_type: PhaseType,
    tempo: TempoLevel,
    num_slots: int,
    rng: random.Random,
) -> list[PhaseTemplate]:
    """Plan a complete list of num_slots templates upfront.

    Rule baked in at planning time: the same template may appear at most
    _MAX_CONSECUTIVE times in a row, then a different one must be chosen.
    The full sequence is decided before any Phase object is created.
    """
    by_type = [t for t in templates if t.type == phase_type]
    if not by_type:
        raise ValueError(f"No templates of type {phase_type}")

    # Prefer tempo-matching templates; fall back to medium, then any
    preferred = [t for t in by_type if tempo in t.tempo_profile]
    if not preferred:
        preferred = [t for t in by_type if TempoLevel.MEDIUM in t.tempo_profile]
    if not preferred:
        preferred = by_type

    plan: list[PhaseTemplate] = []
    last_id: str | None = None
    run_length = 0

    for _ in range(num_slots):
        if run_length >= _MAX_CONSECUTIVE and len(preferred) > 1:
            # Must switch — exclude the current template from candidates
            candidates = [t for t in preferred if t.id != last_id]
        else:
            candidates = preferred

        pick = rng.choice(candidates)
        run_length = run_length + 1 if pick.id == last_id else 1
        last_id = pick.id
        plan.append(pick)

    return plan


# ── Gemini-orchestrated flow ─────────────────────────────────────

_GEMINI_FLOW_PROMPT = """\
You are a movement coach flow designer for a desk worker wellness app.

Audio data:
- Song: {song_name}
- Duration: {duration_sec}s
- Measured BPM: {bpm}
- Measured energy: {energy:.2f}  (0.0=calm, 1.0=intense)

Available phase templates:

NEUTRAL (use for opening and closing only):
  neutral_reset_breath     — Stillness with a breathing cue. Visual pause.
  neutral_shoulder_release — Passive shoulder drop and micro release.

POSE_HOLD (static held positions):
  pose_shoulder_drop_neck_lift  — Shoulders sink down, head elongates upward.
  pose_chest_open_bilateral     — Arms back, chest opens, shoulders retract.
  pose_shoulder_lift_release    — Shoulders lift then release downward.
  pose_elbow_overhead_reach     — Both arms lift overhead, chest opens.

HAND_MOTION (continuous movement sequences):
  motion_arm_diagonal_up_sweep      — Arms sweep diagonally up-left then up-right.
  motion_arm_alternate_up_down      — One arm up while other goes down, alternating.
  motion_arm_vertical_alternate     — Arms vertical, alternate up/down in front of torso.
  motion_arm_accented_circular_loop — Hands accent upward twice then loop downward.

Design rules:
1. First phase: one NEUTRAL, exactly 3 seconds.
2. Second phase: one HAND_MOTION, 8–10 seconds. (REQUIRED — shows movement immediately)
3. Core rhythm: HAND_MOTION (15–30s) → POSE_HOLD (~10s recovery) → HAND_MOTION → POSE_HOLD → …
   After every HAND_MOTION phase, always insert a POSE_HOLD of 8–12 seconds before the next HAND_MOTION.
   No two HAND_MOTION phases may appear back-to-back without a POSE_HOLD between them.
4. Last phase: one NEUTRAL, exactly 3 seconds.
5. Template coverage: ALL 4 POSE_HOLD templates and ALL 4 HAND_MOTION templates MUST each appear at least once.
   Templates MAY repeat as many times as needed to fill the total duration — repetition is allowed and expected.
6. Consecutive repeat cap: if the same template_id appears in two or more consecutive phases,
   EVERY occurrence in that consecutive run must be ≤6s — including the very first occurrence of the run.
   Example: pose_X(6s) → pose_X(6s) → pose_X(6s) is allowed. pose_X(20s) → pose_X(6s) is NOT allowed.
7. Single-occurrence durations (when a template is NOT part of a consecutive repeat run):
   POSE_HOLD: 8–15s.  HAND_MOTION: 15–30s.  (intro motion in rule 2 is exempt)
8. All duration_sec values must be whole integers.
9. Sum of all duration_sec must equal exactly {duration_sec}.
10. High energy (≥0.65) → favour shorter durations; use more repetitions to fill time.
11. Low energy (≤0.40) → slightly longer individual durations; still include all templates.
12. NEUTRAL phases appear only at the very start (rule 1) and very end (rule 4). Never insert NEUTRAL in the core.

Output ONLY a JSON object — no markdown, no prose:
{{
  "phases": [
    {{"template_id": "neutral_reset_breath", "duration_sec": 3}},
    {{"template_id": "motion_arm_diagonal_up_sweep", "duration_sec": 9}},
    {{"template_id": "pose_shoulder_drop_neck_lift", "duration_sec": 10}},
    {{"template_id": "motion_arm_alternate_up_down", "duration_sec": 20}},
    {{"template_id": "pose_chest_open_bilateral", "duration_sec": 10}},
    ...
    {{"template_id": "neutral_shoulder_release", "duration_sec": 3}}
  ]
}}
"""

_VALID_IDS = {
    "neutral_reset_breath", "neutral_shoulder_release",
    "pose_shoulder_drop_neck_lift", "pose_chest_open_bilateral",
    "pose_shoulder_lift_release", "pose_elbow_overhead_reach",
    "motion_arm_diagonal_up_sweep", "motion_arm_alternate_up_down",
    "motion_arm_vertical_alternate", "motion_arm_accented_circular_loop",
}

_PHASE_TYPE_MAP: dict[str, PhaseType] = {
    "neutral_reset_breath":              PhaseType.NEUTRAL,
    "neutral_shoulder_release":          PhaseType.NEUTRAL,
    "pose_shoulder_drop_neck_lift":      PhaseType.POSE_HOLD,
    "pose_chest_open_bilateral":         PhaseType.POSE_HOLD,
    "pose_shoulder_lift_release":        PhaseType.POSE_HOLD,
    "pose_elbow_overhead_reach":         PhaseType.POSE_HOLD,
    "motion_arm_diagonal_up_sweep":      PhaseType.HAND_MOTION,
    "motion_arm_alternate_up_down":      PhaseType.HAND_MOTION,
    "motion_arm_vertical_alternate":     PhaseType.HAND_MOTION,
    "motion_arm_accented_circular_loop": PhaseType.HAND_MOTION,
}


_ALL_POSE_IDS = {
    "pose_shoulder_drop_neck_lift",
    "pose_chest_open_bilateral",
    "pose_shoulder_lift_release",
    "pose_elbow_overhead_reach",
}
_ALL_MOTION_IDS = {
    "motion_arm_diagonal_up_sweep",
    "motion_arm_alternate_up_down",
    "motion_arm_vertical_alternate",
    "motion_arm_accented_circular_loop",
}


def _ensure_all_templates_used(phases_data: list[dict]) -> list[dict]:
    """Replace duplicate phases to ensure every template appears at least once."""
    result = list(phases_data)

    def _fix_missing(missing_ids: set[str], phase_type: PhaseType) -> None:
        for missing_id in missing_ids:
            # Count occurrences of each template of this type
            counts: dict[str, int] = {}
            for p in result:
                if _PHASE_TYPE_MAP.get(p["template_id"]) == phase_type:
                    counts[p["template_id"]] = counts.get(p["template_id"], 0) + 1
            # Replace the last occurrence of any template that appears >1 times
            for i in range(len(result) - 1, -1, -1):
                tid = result[i]["template_id"]
                if _PHASE_TYPE_MAP.get(tid) == phase_type and counts.get(tid, 0) > 1:
                    result[i] = dict(result[i], template_id=missing_id)
                    counts[tid] -= 1
                    break

    used_poses   = {p["template_id"] for p in result if _PHASE_TYPE_MAP.get(p["template_id"]) == PhaseType.POSE_HOLD}
    used_motions = {p["template_id"] for p in result if _PHASE_TYPE_MAP.get(p["template_id"]) == PhaseType.HAND_MOTION}

    _fix_missing(_ALL_POSE_IDS   - used_poses,   PhaseType.POSE_HOLD)
    _fix_missing(_ALL_MOTION_IDS - used_motions, PhaseType.HAND_MOTION)

    return result


def _cap_neutral_duration(phases_data: list[dict], max_sec: int = 3) -> list[dict]:
    """Cap every neutral phase to max_sec seconds.

    Excess seconds are re-inserted as new short POSE_HOLD phases (≤6s each)
    before the closing neutral, rather than extending an existing phase.
    This prevents any single phase from becoming unreasonably long.
    """
    result = list(phases_data)
    excess = 0

    for i, p in enumerate(result):
        if _PHASE_TYPE_MAP.get(p["template_id"]) == PhaseType.NEUTRAL and p["duration_sec"] > max_sec:
            excess += p["duration_sec"] - max_sec
            result[i] = dict(p, duration_sec=max_sec)

    if excess <= 0:
        return result

    # Insert new POSE_HOLD phases (≤6s each) before the closing neutral,
    # cycling through all four pose templates to avoid long consecutive repeats.
    _POSE_FILL = [
        "pose_shoulder_drop_neck_lift",
        "pose_chest_open_bilateral",
        "pose_shoulder_lift_release",
        "pose_elbow_overhead_reach",
    ]
    fill_idx = 0
    close_idx = len(result) - 1  # index of closing neutral (shifts as we insert)
    while excess > 0:
        dur = min(excess, 6)
        result.insert(close_idx, {"template_id": _POSE_FILL[fill_idx % len(_POSE_FILL)], "duration_sec": dur})
        close_idx += 1
        fill_idx += 1
        excess -= dur

    return result


def _ensure_early_motion(phases_data: list[dict]) -> list[dict]:
    """Guarantee a HAND_MOTION appears within 10s of the session start.

    If the first non-neutral phase is a POSE_HOLD, inserts a brief
    HAND_MOTION intro (8s) right after the opening neutral. Also clamps
    the opening neutral to ≤5s so the intro lands before the 10s mark.
    """
    if not phases_data:
        return phases_data

    result = list(phases_data)

    # Clamp opening neutral to 5s
    if _PHASE_TYPE_MAP.get(result[0]["template_id"]) == PhaseType.NEUTRAL:
        if result[0]["duration_sec"] > 5:
            result[0] = dict(result[0], duration_sec=5)

    # Find first non-neutral index
    first_content = next(
        (i for i, p in enumerate(result) if _PHASE_TYPE_MAP.get(p["template_id"]) != PhaseType.NEUTRAL),
        None,
    )
    if first_content is None:
        return result

    # If first content phase is a POSE_HOLD, insert a brief intro HAND_MOTION
    if _PHASE_TYPE_MAP.get(result[first_content]["template_id"]) == PhaseType.POSE_HOLD:
        intro = {"template_id": "motion_arm_diagonal_up_sweep", "duration_sec": 8}
        result = result[:first_content] + [intro] + result[first_content:]

    return result


def _fix_consecutive(phases_data: list[dict]) -> list[dict]:
    """Break any run of the same template_id that exceeds _MAX_CONSECUTIVE.

    Swaps the offending entry with the next entry of the same phase_type
    but a different template_id. Only pose_hold and hand_motion phases are
    subject to the rule; neutral phases are left untouched.
    """
    result = list(phases_data)
    for i in range(_MAX_CONSECUTIVE, len(result)):
        tid = result[i]["template_id"]
        phase_type = _PHASE_TYPE_MAP.get(tid)
        if phase_type not in (PhaseType.POSE_HOLD, PhaseType.HAND_MOTION):
            continue
        # Check if the previous _MAX_CONSECUTIVE entries are all the same tid
        if all(result[i - k]["template_id"] == tid for k in range(1, _MAX_CONSECUTIVE + 1)):
            # Find the nearest later entry of the same phase_type but different id
            for j in range(i + 1, len(result)):
                if _PHASE_TYPE_MAP.get(result[j]["template_id"]) == phase_type \
                        and result[j]["template_id"] != tid:
                    result[i], result[j] = result[j], result[i]
                    break
    return result


def _cap_consecutive_repeat_duration(phases_data: list[dict], max_repeat_sec: int = 6) -> list[dict]:
    """Cap duration of any phase that repeats consecutively to max_repeat_sec seconds.

    The first occurrence of a template keeps its full duration.
    Any immediately following occurrence of the same template_id is capped.
    Excess seconds are redistributed to the preceding non-repeat phase.
    """
    result = list(phases_data)
    excess = 0

    for i in range(1, len(result)):
        tid = result[i]["template_id"]
        phase_type = _PHASE_TYPE_MAP.get(tid)
        if phase_type not in (PhaseType.POSE_HOLD, PhaseType.HAND_MOTION):
            continue
        if result[i - 1]["template_id"] == tid and result[i]["duration_sec"] > max_repeat_sec:
            excess += result[i]["duration_sec"] - max_repeat_sec
            result[i] = dict(result[i], duration_sec=max_repeat_sec)

    # Add excess to the last non-neutral phase to preserve total duration
    if excess > 0:
        for i in range(len(result) - 1, -1, -1):
            if _PHASE_TYPE_MAP.get(result[i]["template_id"]) != PhaseType.NEUTRAL:
                result[i] = dict(result[i], duration_sec=result[i]["duration_sec"] + excess)
                break

    return result


def generate_flow_with_gemini(
    duration_sec: int,
    bpm: int,
    energy: float,
    song_name: str,
) -> Flow | None:
    """Ask Gemini to orchestrate a flow from real audio features.

    Returns None on any failure so the caller can fall back to the template engine.
    """
    if gemini_client is None:
        return None

    templates = _load_templates()
    template_map = {t.id: t for t in templates}

    prompt = _GEMINI_FLOW_PROMPT.format(
        song_name=song_name,
        duration_sec=duration_sec,
        bpm=bpm,
        energy=energy,
    )

    try:
        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        raw = response.text.strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        data = json.loads(raw)
    except Exception as exc:
        logger.warning("Gemini flow orchestration request failed: %s", exc)
        return None

    phases_data: list[dict] = data.get("phases", [])
    if not phases_data:
        logger.warning("Gemini returned empty phases list")
        return None

    # Validate all IDs
    for p in phases_data:
        if p.get("template_id") not in _VALID_IDS:
            logger.warning("Unknown template_id from Gemini: %s", p.get("template_id"))
            return None

    # Validate total duration (within ±10%)
    total = sum(p["duration_sec"] for p in phases_data)
    if abs(total - duration_sec) > max(10, duration_sec * 0.10):
        logger.warning("Gemini duration mismatch: %ss requested, %ss returned", duration_sec, total)
        return None

    # Ensure a movement appears within the first 10s
    phases_data = _ensure_early_motion(phases_data)

    # Cap neutral phases to 3s
    phases_data = _cap_neutral_duration(phases_data, max_sec=3)

    # Ensure every template appears at least once
    phases_data = _ensure_all_templates_used(phases_data)

    # Enforce MAX_CONSECUTIVE rule (Gemini may not respect it)
    phases_data = _fix_consecutive(phases_data)

    # Cap consecutive repeat duration to 6s
    phases_data = _cap_consecutive_repeat_duration(phases_data, max_repeat_sec=6)

    # Build Flow
    phases: list[Phase] = []
    cursor = 0.0
    for i, p in enumerate(phases_data):
        tid = p["template_id"]
        dur = int(p["duration_sec"])
        end = float(duration_sec) if i == len(phases_data) - 1 else round(cursor + dur, 1)

        tmpl = template_map.get(tid)
        tracked = _expand_anchors(tmpl.primary_anchors) if tmpl and tmpl.primary_anchors else []
        description = tmpl.intent if tmpl else tid.replace("_", " ")

        phases.append(Phase(
            index=i,
            name=tid,
            phase_type=_PHASE_TYPE_MAP[tid],
            start_sec=cursor,
            end_sec=end,
            tracked_points=tracked,
            description=description,
        ))
        cursor = end

    hex_suffix = hashlib.md5(f"{duration_sec}-{bpm}-{song_name}".encode()).hexdigest()[:4]
    flow_id = f"gen-{duration_sec}s-ai-{hex_suffix}"

    return Flow(
        flow_id=flow_id,
        name=f"AI Flow · {song_name}",
        duration_sec=float(duration_sec),
        phases=phases,
    )


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

    # Opening neutral — pick randomly from neutral templates
    neutral_tmpls = [t for t in templates if t.type == PhaseType.NEUTRAL]
    if not neutral_tmpls:
        neutral_tmpls = [t for t in templates]
    open_tmpl = rng.choice(neutral_tmpls)
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

    # ── Plan full sequences upfront before assigning any timing ──
    pose_plan   = _plan_sequence(templates, PhaseType.POSE_HOLD,   tempo, num_pairs, rng)
    motion_plan = _plan_sequence(templates, PhaseType.HAND_MOTION, tempo, num_pairs, rng)

    for pair_i in range(num_pairs):
        # Pose Hold
        ph_tmpl = pose_plan[pair_i]
        ph_end = round(cursor + ph_dur, 1)
        phases.append(Phase(
            index=idx,
            name=ph_tmpl.id,
            phase_type=PhaseType.POSE_HOLD,
            start_sec=cursor,
            end_sec=ph_end,
            tracked_points=_expand_anchors(ph_tmpl.primary_anchors),
            description=ph_tmpl.intent,
        ))
        cursor = ph_end
        idx += 1

        # Hand Motion
        hm_tmpl = motion_plan[pair_i]
        hm_end = round(cursor + hm_dur, 1)
        if pair_i == num_pairs - 1:
            hm_end = round(duration_sec - close_neutral_dur, 1)
        phases.append(Phase(
            index=idx,
            name=hm_tmpl.id,
            phase_type=PhaseType.HAND_MOTION,
            start_sec=cursor,
            end_sec=hm_end,
            tracked_points=_expand_anchors(hm_tmpl.primary_anchors),
            description=hm_tmpl.intent,
        ))
        cursor = hm_end
        idx += 1

    # Closing neutral — prefer a different template than the opening one
    close_candidates = [t for t in neutral_tmpls if t.id != open_tmpl.id] or neutral_tmpls
    close_tmpl = rng.choice(close_candidates)
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
