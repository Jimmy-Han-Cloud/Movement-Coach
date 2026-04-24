import json
import logging
import re

from app.models.music import MusicAnalysis
from app.models.phase_template import TempoLevel
from app.services.gemini import _client as gemini_client

logger = logging.getLogger(__name__)

# ── Fallback table for common preset songs ────────────────────────
# Ensures consistent results without API calls for known songs.
_PRESET_MAP: dict[str, tuple[TempoLevel, int, float]] = {
    "morning flow":    (TempoLevel.SLOW,   72,  0.35),
    "energy boost":    (TempoLevel.FAST,  128,  0.85),
    "desk break":      (TempoLevel.MEDIUM,  96,  0.55),
    "focus reset":     (TempoLevel.MEDIUM, 104,  0.60),
    "evening unwind":  (TempoLevel.SLOW,   68,  0.25),
}

_ANALYSIS_PROMPT = """\
You are a music tempo classifier for a seated movement coaching app. \
Desk workers use this app during short breaks; movements are gentle and rhythmic. \
Classify the following track and reply ONLY with valid JSON — no markdown, no prose.

Song: {song_name}
Artist: {artist}
Duration: {duration_sec}s

Required JSON schema:
{{
  "tempo_level": "slow" | "medium" | "fast",
  "estimated_bpm": <integer 55–160>,
  "energy": <float 0.0–1.0>,
  "reasoning": "<one short sentence>"
}}

Rules:
- slow  → calm, relaxing, ≤85 BPM, energy ≤0.40
- medium → steady, moderate, 86–115 BPM, energy 0.41–0.70
- fast  → upbeat, energetic, ≥116 BPM, energy >0.70
- If genre/vibe cannot be determined from the title, default to medium.
"""


def analyze_music(
    song_name: str,
    artist: str,
    duration_sec: int,
    bpm: int | None = None,
    energy: float | None = None,
) -> MusicAnalysis:
    """Classify song tempo. Uses browser-measured BPM/energy when provided."""

    # ── 0. Browser-measured data takes priority ──
    if bpm is not None and energy is not None:
        if bpm <= 85:
            tempo_level = TempoLevel.SLOW
        elif bpm <= 115:
            tempo_level = TempoLevel.MEDIUM
        else:
            tempo_level = TempoLevel.FAST
        return MusicAnalysis(
            song_name=song_name,
            duration_sec=duration_sec,
            tempo_level=tempo_level,
            estimated_bpm=bpm,
            energy=round(energy, 3),
            reasoning=f"Classified from browser audio analysis: {bpm} BPM.",
        )

    key = song_name.strip().lower()

    # ── 1. Preset lookup (fast, deterministic) ──
    if key in _PRESET_MAP:
        tempo_level, bpm, energy = _PRESET_MAP[key]
        return MusicAnalysis(
            song_name=song_name,
            duration_sec=duration_sec,
            tempo_level=tempo_level,
            estimated_bpm=bpm,
            energy=energy,
            reasoning="Matched preset song catalog.",
        )

    # ── 2. Gemini classification ──
    if gemini_client is not None:
        try:
            prompt = _ANALYSIS_PROMPT.format(
                song_name=song_name,
                artist=artist or "Unknown",
                duration_sec=duration_sec,
            )
            response = gemini_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
            )
            raw = response.text.strip()

            # Strip markdown fences if present
            raw = re.sub(r"^```(?:json)?\s*", "", raw)
            raw = re.sub(r"\s*```$", "", raw)

            data = json.loads(raw)

            return MusicAnalysis(
                song_name=song_name,
                duration_sec=duration_sec,
                tempo_level=TempoLevel(data["tempo_level"]),
                estimated_bpm=int(data["estimated_bpm"]),
                energy=float(data["energy"]),
                reasoning=str(data.get("reasoning", "")),
            )
        except Exception as exc:
            logger.warning("Gemini music analysis failed (%s) — using fallback", exc)

    # ── 3. Duration-based fallback ──
    if duration_sec <= 150:
        tempo_level, bpm, energy = TempoLevel.FAST, 120, 0.75
    elif duration_sec <= 240:
        tempo_level, bpm, energy = TempoLevel.MEDIUM, 100, 0.55
    else:
        tempo_level, bpm, energy = TempoLevel.SLOW, 75, 0.30

    return MusicAnalysis(
        song_name=song_name,
        duration_sec=duration_sec,
        tempo_level=tempo_level,
        estimated_bpm=bpm,
        energy=energy,
        reasoning="Fallback classification based on track duration.",
    )
