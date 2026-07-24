# Rule-based red-flag detection.
# This layer runs independently of the LLM and can force an "emergency"
# classification regardless of what the model concludes — a critical
# safety pattern for clinical AI: never let a probabilistic model be the
# only thing standing between a patient and an emergency escalation.

RED_FLAG_COMBINATIONS = [
    (["chest pain"], ["shortness of breath", "difficulty breathing", "trouble breathing", "can't breathe", "cant breathe", "breathless"]),
    (["chest pain"], ["left arm pain", "arm pain", "jaw pain"]),
    (["severe headache"], ["vision loss", "blurred vision", "confusion", "can't see", "cant see", "vision changes"]),
    (["difficulty breathing", "trouble breathing", "can't breathe", "cant breathe"], ["blue lips", "swelling face", "swelling throat"]),
    (["severe bleeding"], []),
    (["loss of consciousness"], []),
    (["suicidal thoughts", "suicidal", "want to die", "kill myself"], []),
    (["stroke symptoms", "face drooping", "slurred speech"], ["weakness one side", "weakness on one side", "arm weakness"]),
]

RED_FLAG_KEYWORDS_STANDALONE = [
    "severe bleeding",
    "loss of consciousness",
    "unresponsive",
    "not breathing",
    "suicidal",
    "want to die",
    "kill myself",
]

def check_red_flags(symptom_text: str):
    """
    Checks extracted symptom text (lowercased) against known dangerous
    combinations and standalone critical keywords. Returns
    (triggered: bool, reason: str | None).

    Note: this uses substring matching, which is intentionally simple and
    auditable — a real production system would need a more robust approach
    (e.g., a curated medical ontology or NER model), but simple, transparent
    rules are preferable here to an opaque black box for a safety-critical
    layer. Known limitation: still vulnerable to phrasing not covered by
    the keyword lists below.
    """
    text = symptom_text.lower()

    for keyword in RED_FLAG_KEYWORDS_STANDALONE:
        if keyword in text:
            return True, f"Standalone critical symptom detected: '{keyword}'"

    for primary_list, secondary_list in RED_FLAG_COMBINATIONS:
        primary_hit = any(p in text for p in primary_list)
        if not secondary_list:
            continue
        secondary_hit = any(s in text for s in secondary_list)
        if primary_hit and secondary_hit:
            return True, f"Dangerous combination detected: '{primary_list[0]}' + related symptom"

    return False, None