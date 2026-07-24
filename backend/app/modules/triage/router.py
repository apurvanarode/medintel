from fastapi import APIRouter
from .schemas import TriageRequest, TriageResponse
from .service import run_triage

router = APIRouter(prefix="/api/triage", tags=["Triage"])

@router.post("/analyze", response_model=TriageResponse)
def analyze_triage(request: TriageRequest):
    conversation = [{"role": m.role, "content": m.content} for m in request.conversation]
    result = run_triage(conversation)
    return TriageResponse(**result)