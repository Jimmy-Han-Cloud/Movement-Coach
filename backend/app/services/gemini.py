import logging

from google import genai

from app.config import settings
from app.models.session import PhaseResult

logger = logging.getLogger(__name__)

_client = None

if settings.gemini_api_key:
    _client = genai.Client(api_key=settings.gemini_api_key)
else:
    logger.warning("GEMINI_API_KEY not set — summary generation unavailable")

SYSTEM_PROMPT = (
    "You are a supportive movement coach for desk workers. "
    "Given a session result summary, write 2-3 short sentences of encouraging, "
    "non-judgmental feedback. Focus on participation and effort, not performance. "
    "Do not use scoring language. Do not mention fitness or exercise. "
    "Keep the tone warm and calm."
)


def is_available() -> bool:
    return _client is not None


def generate_summary(phase_results: list[PhaseResult], duration_sec: float) -> str:
    if _client is None:
        raise RuntimeError("Gemini API key not configured")

    phases_text = "\n".join(
        f"- {r.phase_name}: participated={r.participation}, "
        f"hold_achieved={r.hold_achieved}, elbow_participation={r.elbow_participation}"
        for r in phase_results
    )
    user_prompt = (
        f"Session duration: {duration_sec:.0f} seconds\n"
        f"Phase results:\n{phases_text}"
    )

    response = _client.models.generate_content(
        model="gemini-2.0-flash",
        contents=f"{SYSTEM_PROMPT}\n\n{user_prompt}",
    )
    return response.text.strip()
