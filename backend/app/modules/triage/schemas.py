from pydantic import BaseModel
from typing import List, Optional

class TriageMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class TriageRequest(BaseModel):
    conversation: List[TriageMessage]

class TriageResponse(BaseModel):
    needs_more_info: bool
    clarifying_question: Optional[str] = None
    extracted_symptoms: List[str] = []
    urgency_level: Optional[str] = None  # "routine", "urgent", "emergency"
    reasoning: Optional[str] = None
    red_flag_triggered: bool = False
    red_flag_reason: Optional[str] = None