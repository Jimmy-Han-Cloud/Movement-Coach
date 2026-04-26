import base64
import logging

from google import genai
from google.genai import types

from app.config import settings

logger = logging.getLogger(__name__)

_client = None

if settings.gemini_api_key:
    _client = genai.Client(api_key=settings.gemini_api_key)

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

AVATAR_PROMPT = (
    "Generate a friendly, clean cartoon-style avatar based on this person's photo. "
    "The avatar should be simple, colorful, and suitable as a profile picture. "
    "Keep recognizable features like hair style and face shape, "
    "but render in a flat illustration style. "
    "Output a single square avatar image with a plain background."
)


def is_available() -> bool:
    return _client is not None


def validate_upload(content_type: str, size: int) -> str | None:
    """Return an error message if invalid, None if OK."""
    if content_type not in ALLOWED_CONTENT_TYPES:
        return f"File type not allowed. Accepted: {', '.join(ALLOWED_CONTENT_TYPES)}"
    if size > MAX_FILE_SIZE:
        return f"File too large. Maximum: {MAX_FILE_SIZE // (1024 * 1024)}MB"
    return None


def generate_avatar(photo_bytes: bytes, content_type: str) -> tuple[str, str]:
    """Generate cartoon avatar from photo bytes.

    Returns (base64_image, output_content_type).
    The input photo_bytes are not retained after this call.
    """
    if _client is None:
        raise RuntimeError("Gemini API key not configured")

    response = _client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            types.Part.from_bytes(data=photo_bytes, mime_type=content_type),
            AVATAR_PROMPT,
        ],
        config=types.GenerateContentConfig(
            response_modalities=["IMAGE", "TEXT"],
        ),
    )

    for part in response.candidates[0].content.parts:
        if part.inline_data is not None:
            image_bytes = part.inline_data.data
            output_mime = part.inline_data.mime_type or "image/png"
            return base64.b64encode(image_bytes).decode("ascii"), output_mime

    raise RuntimeError("Gemini did not return an image")
