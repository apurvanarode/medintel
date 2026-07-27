from fastapi import APIRouter
from .schemas import ChatRequest, ChatResponse, SampleCase
from .service import run_chat, SAMPLE_DISCHARGE_SUMMARIES

router = APIRouter(prefix="/api/chatbot", tags=["Care Companion"])

@router.get("/cases", response_model=list[SampleCase])
def list_cases():
    return [
        SampleCase(case_id=key, title=val["title"], condition=val["condition"], summary=val["summary"].strip())
        for key, val in SAMPLE_DISCHARGE_SUMMARIES.items()
    ]

@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    conversation = [{"role": m.role, "content": m.content} for m in request.conversation]
    result = run_chat(request.case_id, conversation)
    return ChatResponse(**result)