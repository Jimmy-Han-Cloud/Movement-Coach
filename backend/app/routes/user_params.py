from fastapi import APIRouter, Depends

from app.models.user_params import UserParams, UserParamsUpdate
from app.services.auth import get_current_user
from app.services.user_params import get_params, update_params

router = APIRouter(prefix="/api/users/me/params", tags=["user-params"])


@router.get("", response_model=UserParams)
def read_params(user_id: str = Depends(get_current_user)):
    return get_params(user_id)


@router.patch("", response_model=UserParams)
def patch_params(body: UserParamsUpdate, user_id: str = Depends(get_current_user)):
    updates = body.model_dump(exclude_none=True)
    if not updates:
        return get_params(user_id)
    return update_params(user_id, updates)
