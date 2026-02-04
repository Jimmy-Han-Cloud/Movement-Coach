from fastapi import APIRouter, Depends, HTTPException, UploadFile

from app.models.avatar import AvatarResponse
from app.services.auth import get_current_user
from app.services.avatar import generate_avatar, is_available, validate_upload

router = APIRouter(prefix="/api/avatar", tags=["avatar"])


@router.post("", response_model=AvatarResponse)
async def create_avatar(
    file: UploadFile,
    user_id: str = Depends(get_current_user),
):
    if not is_available():
        raise HTTPException(status_code=503, detail="Avatar service unavailable")

    content_type = file.content_type or ""
    photo_bytes = await file.read()

    error = validate_upload(content_type, len(photo_bytes))
    if error:
        raise HTTPException(status_code=400, detail=error)

    try:
        image_base64, output_type = generate_avatar(photo_bytes, content_type)
    finally:
        del photo_bytes

    return AvatarResponse(image_base64=image_base64, content_type=output_type)
