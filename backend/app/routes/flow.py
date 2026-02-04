from fastapi import APIRouter, HTTPException

from app.models.flow import Flow
from app.services.flow import get_flow, list_flow_ids

router = APIRouter(prefix="/api/flows", tags=["flows"])


@router.get("", response_model=list[str])
def list_flows():
    return list_flow_ids()


@router.get("/{flow_id}", response_model=Flow)
def read_flow(flow_id: str):
    flow = get_flow(flow_id)
    if flow is None:
        raise HTTPException(status_code=404, detail="Flow not found")
    return flow
