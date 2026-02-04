from app.models.user_params import UserParams
from app.services.firestore import get_document, save_document

COLLECTION = "user_params"


def get_params(user_id: str) -> UserParams:
    data = get_document(COLLECTION, user_id)
    if data is None:
        return UserParams()
    return UserParams(**data)


def update_params(user_id: str, updates: dict) -> UserParams:
    current = get_params(user_id)
    merged = current.model_dump()
    merged.update(updates)
    params = UserParams(**merged)
    save_document(COLLECTION, user_id, params.model_dump())
    return params
