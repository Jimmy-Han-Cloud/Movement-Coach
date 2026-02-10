from fastapi import APIRouter, HTTPException

from app.models.flow import Flow
from app.models.flow_generate import FlowGenerateRequest
from app.services.flow import get_flow, list_flow_ids
from app.services.flow_generator import generate_flow

router = APIRouter(prefix="/api/flows", tags=["flows"])


@router.get("", response_model=list[str])
def list_flows():
    return list_flow_ids()


@router.post("/generate", response_model=Flow)
def create_generated_flow(req: FlowGenerateRequest):
    return generate_flow(req.duration_sec, req.tempo, req.seed)


@router.get("/{flow_id}", response_model=Flow)
def read_flow(flow_id: str):
    flow = get_flow(flow_id)
    if flow is None:
        raise HTTPException(status_code=404, detail="Flow not found")
    return flow
