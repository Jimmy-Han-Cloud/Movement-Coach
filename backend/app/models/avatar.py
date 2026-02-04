from pydantic import BaseModel


class AvatarResponse(BaseModel):
    image_base64: str
    content_type: str
