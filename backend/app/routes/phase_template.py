from fastapi import APIRouter, HTTPException

from app.models.phase_template import PhaseTemplate
from app.services.phase_template import (
    get_phase_template,
    list_phase_templates,
    seed_phase_templates,
)

router = APIRouter(prefix="/api/phase-templates", tags=["phase-templates"])


@router.get("", response_model=list[PhaseTemplate])
def list_templates():
    return list_phase_templates()


@router.get("/{template_id}", response_model=PhaseTemplate)
def read_template(template_id: str):
    tmpl = get_phase_template(template_id)
    if tmpl is None:
        raise HTTPException(status_code=404, detail="Phase template not found")
    return tmpl


# Debug-only seed endpoint (registered conditionally in main.py)
seed_router = APIRouter(prefix="/api/phase-templates", tags=["phase-templates"])


@seed_router.post("/seed")
def seed_templates():
    count = seed_phase_templates()
    return {"seeded": count}
