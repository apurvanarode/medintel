from pydantic import BaseModel
from typing import List

class SampleCase(BaseModel):
    case_id: str
    title: str
    condition: str
    summary: str

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    case_id: str
    conversation: List[ChatMessage]

class ChatResponse(BaseModel):
    answer: str
    deferred_to_clinician: bool