import os
import json
import google.generativeai as genai
from dotenv import load_dotenv
from .red_flags import check_red_flags 
from app.db.database import log_triage_event

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-flash-lite-latest")

SYSTEM_PROMPT = """You are a clinical triage assistant. Your job is to analyze a patient's
described symptoms and determine if you have ENOUGH information to assess urgency, or if you
need to ask ONE clarifying question first.

Respond ONLY with valid JSON, no markdown formatting, no backticks, in this exact structure:

{
  "needs_more_info": true or false,
  "clarifying_question": "a single, specific follow-up question, or null if not needed",
  "extracted_symptoms": ["list", "of", "symptoms", "mentioned", "so", "far"],
  "urgency_level": "routine" or "urgent" or "emergency" or null (null if needs_more_info is true),
  "reasoning": "a brief, plain-language explanation of the urgency assessment, or null if needs_more_info is true"
}

Guidelines:
- Ask AT MOST one clarifying question total before finalizing an assessment — do not stall indefinitely.
- "routine": minor symptoms, safe to monitor or see a doctor within days
- "urgent": should be seen within hours, not life-threatening but needs prompt attention
- "emergency": potentially life-threatening, needs immediate emergency care
- Err on the side of caution — if uncertain between two levels, choose the more urgent one.
- Never provide a specific diagnosis, only urgency guidance.
"""

def run_triage(conversation: list) -> dict:
    convo_text = "\n".join([f"{m['role']}: {m['content']}" for m in conversation])

    full_prompt = f"{SYSTEM_PROMPT}\n\nConversation so far:\n{convo_text}\n\nRespond with JSON only."

    response = model.generate_content(full_prompt)
    raw_text = response.text.strip()

    # Defensive cleanup in case the model wraps output in markdown fences
    if raw_text.startswith("```"):
        raw_text = raw_text.strip("`")
        if raw_text.startswith("json"):
            raw_text = raw_text[4:].strip()

    try:
        parsed = json.loads(raw_text)
    except json.JSONDecodeError:
        # Fallback: if the model didn't return valid JSON, force a safe default
        parsed = {
            "needs_more_info": True,
            "clarifying_question": "Could you describe your main symptom in a bit more detail?",
            "extracted_symptoms": [],
            "urgency_level": None,
            "reasoning": None,
        }

    # Run the independent rule-based safety layer on all extracted symptoms + raw conversation
    all_text = convo_text + " " + " ".join(parsed.get("extracted_symptoms", []))
    triggered, reason = check_red_flags(all_text)

    if triggered:
        parsed["needs_more_info"] = False
        parsed["urgency_level"] = "emergency"
        parsed["reasoning"] = "Automatically escalated due to a detected high-risk symptom combination. Please seek immediate emergency care."
        parsed["red_flag_triggered"] = True
        parsed["red_flag_reason"] = reason
    else:
        parsed["red_flag_triggered"] = False
        parsed["red_flag_reason"] = None 
    if not parsed.get("needs_more_info"):
        log_triage_event(parsed.get("urgency_level"), parsed.get("red_flag_triggered", False))

    return parsed