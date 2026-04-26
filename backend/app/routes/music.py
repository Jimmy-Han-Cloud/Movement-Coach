import logging

from fastapi import APIRouter, Depends

from app.models.flow import Flow
from app.models.flow_generate import FlowGenerateRequest
from app.models.music import MusicAnalysis, MusicAnalyzeRequest
from app.services.auth import get_current_user
from app.services.rate_limit import check_rate_limit
from app.services.firestore import delete_document, get_document, save_document
from app.services.flow_generator import generate_flow, generate_flow_with_gemini
from app.services.music import analyze_music

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/music", tags=["music"])

_PRESET_FLOW_COLLECTION = "preset_flows"

_MEMORY_FLOW_CACHE: dict[str, Flow] = {}

_PHASE_MAX_SEC = {"pose_hold": 15, "hand_motion": 30}


def _flow_is_valid(flow: Flow) -> bool:
    """Return False if any content phase exceeds its allowed maximum duration."""
    for phase in flow.phases:
        max_sec = _PHASE_MAX_SEC.get(phase.phase_type.value)
        if max_sec and (phase.end_sec - phase.start_sec) > max_sec:
            return False
    return True


def _load_cached_flow(song_id: str) -> Flow | None:
    if song_id in _MEMORY_FLOW_CACHE:
        return _MEMORY_FLOW_CACHE[song_id]

    data = get_document(_PRESET_FLOW_COLLECTION, song_id)
    if data is None:
        return None
    try:
        flow = Flow(**data)
    except Exception as exc:
        logger.warning("Corrupt cached flow for %s: %s", song_id, exc)
        delete_document(_PRESET_FLOW_COLLECTION, song_id)
        return None
    if not _flow_is_valid(flow):
        logger.warning("Stale/invalid cached flow for %s — clearing cache for regeneration", song_id)
        delete_document(_PRESET_FLOW_COLLECTION, song_id)
        _MEMORY_FLOW_CACHE.pop(song_id, None)
        return None

    _MEMORY_FLOW_CACHE[song_id] = flow
    return flow


def _cache_flow(song_id: str, flow: Flow) -> None:
    save_document(_PRESET_FLOW_COLLECTION, song_id, flow.model_dump())


@router.post("/analyze", response_model=MusicAnalysis)
def analyze_song(
    req: MusicAnalyzeRequest,
    user_id: str = Depends(get_current_user),
) -> MusicAnalysis:
    """Classify a song's tempo and energy from its metadata."""
    check_rate_limit(f"music-analyze:{user_id}", max_calls=30, window_sec=3600)
    return analyze_music(req.song_name, req.artist, req.duration_sec)


@router.post("/flow", response_model=Flow)
def generate_flow_for_song(
    req: MusicAnalyzeRequest,
    user_id: str = Depends(get_current_user),
) -> Flow:
    """Return a flow for a song.

    Preset songs (song_id provided, no bpm/energy at runtime):
      Read from Firestore cache and return immediately.
      Cache is populated once at dev-time via /dev/seed page (browser analysis + Gemini).
      Falls back to template engine only if cache is missing (e.g. before seeding).

    Seeding (song_id + bpm + energy provided):
      Called by the /dev/seed page during development.
      Gemini orchestrates the flow → saved to Firestore cache.

    Uploaded songs (bpm + energy, no song_id):
      Gemini orchestrates fresh every time. Not cached.
    """
    check_rate_limit(f"music-flow:{user_id}", max_calls=30, window_sec=3600)

    # ── Preset song at runtime: read cache, return immediately ──────
    if req.song_id and req.bpm is None and req.energy is None:
        cached = _load_cached_flow(req.song_id)
        if cached:
            return cached
        logger.warning("No cached flow for preset song %s — falling back to template engine", req.song_id)
        analysis = analyze_music(req.song_name, req.artist, req.duration_sec)
        return generate_flow(duration_sec=req.duration_sec, tempo=analysis.tempo_level)

    # ── Seed mode or uploaded song: generate with Gemini ───────────
    analysis = analyze_music(req.song_name, req.artist, req.duration_sec, req.bpm, req.energy)

    # Don't trust user-provided file names for uploads — the name could be anything.
    # Preset songs (song_id set) have reliable names; everything else gets a neutral label.
    gemini_song_name = req.song_name if req.song_id else "Uploaded Track"

    flow: Flow | None = None
    if req.bpm is not None and req.energy is not None:
        flow = generate_flow_with_gemini(
            duration_sec=req.duration_sec,
            bpm=analysis.estimated_bpm,
            energy=analysis.energy,
            song_name=gemini_song_name,
            energy_timeline=req.energy_timeline,
        )

    if flow is None:
        flow = generate_flow(duration_sec=req.duration_sec, tempo=analysis.tempo_level)

    # ── Seed mode: save to Firestore ────────────────────────────────
    if req.song_id:
        _cache_flow(req.song_id, flow)
        logger.info("Seeded preset flow for %s → %s", req.song_id, flow.flow_id)

    return flow
