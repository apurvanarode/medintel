# System Design: MedIntel — AI-Powered Clinical Decision & Care Management Platform

This document covers the architecture, engineering decisions, honest limitations, and
lessons learned while building MedIntel. It reflects a genuine multi-module build, including
real bugs discovered through testing and how they were resolved.

---

## 1. Architecture Overview
[React + Tailwind Frontend]
|
v
[FastAPI Backend] ── modular structure, one folder per capability:
|
|── /api/triage (NLP symptom analysis + rule-based safety layer)
|── /api/imaging (CV pneumonia detection + Grad-CAM explainability)
|── /api/risk (XGBoost readmission risk + SHAP + priority queue)
|── /api/chatbot (RAG-style patient care companion)
|── /api/dashboard (aggregated operational analytics)
|
v
[SQLite] — logs real usage across all modules, feeding the Ops Dashboard
Each module is self-contained (own schemas, service logic, and router), registered
independently in `main.py`. This mirrors a microservice-oriented mindset even within
a single deployable FastAPI app — each module could be extracted into its own service
later with minimal refactoring, since they don't share internal state.

---

## 2. Module-by-Module Design Decisions

### 2.1 Triage Assistant — LLM + Independent Rule-Based Safety Layer

**Decision:** Use Gemini for multi-turn symptom extraction and urgency reasoning, but never
trust the LLM as the sole safety mechanism. A separate, deterministic rule-based layer
(`red_flags.py`) checks extracted symptoms against known dangerous combinations
(e.g., chest pain + difficulty breathing) and can force an "emergency" classification
regardless of what the LLM concludes.

**Why this matters:** LLMs are probabilistic and can occasionally understate risk or
misread phrasing. A safety-critical system should never depend on a single point of
failure, especially not an opaque one. The rule-based layer is simple, auditable, and acts
as a backstop.

**A real bug we found and fixed:** During testing, the input "chest pain and trouble
breathing" did NOT trigger the red-flag layer, even though "chest pain + difficulty
breathing" was one of our hardcoded rules. The gap: our rule matched the literal phrase
"difficulty breathing," but the LLM had extracted the symptom as "trouble breathing" — a
different but equivalent phrasing our keyword list didn't cover. The LLM itself still
correctly classified this as an emergency on its own reasoning, but our independent safety
net had a real blind spot. We expanded the keyword variants for each red-flag category as
a fix, and explicitly documented that this rule-based approach has an inherent, ongoing
maintenance burden: **it will always be vulnerable to phrasings not yet covered by the
keyword lists**. A production system would need either a continuously expanding, curated
medical ontology or a dedicated clinical NER model rather than hand-written keyword lists.

### 2.2 Imaging Diagnosis — CV + Explainability

**Decision:** DenseNet121 (transfer learning), a standard published architecture choice for
chest X-ray classification, paired with Grad-CAM to visualize which image regions drove
each prediction.

**Why explainability matters here specifically:** A bare "PNEUMONIA: 94% confidence" output
is not clinically useful and could encourage blind trust in the model. Showing *where* the
model is focusing lets a clinician sanity-check whether the model is looking at genuinely
relevant lung regions versus, say, an artifact or an irrelevant part of the image.

**Known limitation:** Test accuracy was 90.06%, in line with published results on this
dataset. However, the validation set in the source data was very small (16 images) and
showed noisy, unstable accuracy during training — a reminder that dataset split quality
matters as much as model architecture, and that headline accuracy numbers should always be
checked against how reliable the underlying evaluation set actually is.

### 2.3 Risk Prediction — Classical ML + SHAP + Priority Queue

**Decision:** XGBoost (not deep learning) for structured/tabular EHR-style data — the right
tool for this data type, and one that pairs naturally with SHAP for per-prediction
explainability.

**Real-world benchmark honesty:** ROC-AUC of 0.68 on 30-day readmission prediction is
consistent with published research using this exact dataset — this is a genuinely hard
prediction problem given real EHR data alone, and a suspiciously higher number would be
more likely to indicate data leakage than a better model.

**Precision/recall tradeoff, made deliberately:** The model was tuned (via
`scale_pos_weight`) to favor recall over precision for the "will be readmitted" class
(61% recall, 18% precision). In a clinical resource-allocation context, missing a
high-risk patient (false negative) is generally more costly than an unnecessary follow-up
call (false positive) — so this tradeoff was a deliberate design choice, not an
unaddressed weakness.

**DSA component:** Follow-up call slots are allocated via a max-heap-based priority queue
(`priority_queue.py`), not a simple sort. This choice matters in a system where patients
are continuously re-scored as new data arrives — a heap allows efficient insertion of newly
arriving high-risk patients (O(log n)) without re-sorting the entire population each time,
which a naive full-list sort would require.

### 2.4 Care Companion — Grounded RAG Chatbot with Clinical Guardrails

**Decision:** Responses are grounded strictly in the patient's own discharge summary (not
general web knowledge), with an explicit instruction set forcing the model to flag any
response touching medication changes, symptom danger assessment, or anything outside the
provided summary as requiring clinician follow-up — regardless of whether the model's
inline answer was already correct.

**A real gap we found and fixed:** Initially, asking "can I stop taking clopidogrel if I
feel fine?" produced a *correct* answer (telling the patient not to stop it without
approval) but incorrectly returned `deferred_to_clinician: false`. The model conflated
"giving safe advice" with "not needing deferral" — but these are different things. The fix
was rewriting the prompt to explicitly separate these two judgments: the *content* of the
answer can be safe and correct, while the *category* of question (any medication change)
should always trigger the deferral flag, independent of how good the inline answer was.
This is a good illustration of a subtle but important LLM prompt-engineering lesson: safety
flags need to be tied to *question category*, not to the model's confidence in its own
answer.

### 2.5 Ops Dashboard — Real Logging, Seeded History

**Decision:** All four other modules write real events to a shared SQLite database on every
use. To avoid an empty dashboard on first run (a poor demo experience), a seeding script
pre-populates 7 days of realistic synthetic historical activity before any real usage
occurs.

**Honesty note:** The seeded historical data is synthetic (generated with fixed random
seeds for reproducibility) and clearly distinguishable in the codebase (`seed_dashboard_data.py`)
from the real, live logging path used by the other four modules. This is a common and
reasonable pattern for demoing operational dashboards without needing weeks of real usage
data, but it should not be mistaken for real historical hospital data.

---

## 3. Known Limitations (Portfolio Scope, Stated Honestly)

- **No authentication/authorization layer.** A real clinical system would need role-based
  access control (clinician vs. patient vs. administrator views), audit logging, and
  encryption at rest — none of which are implemented here, since this is a portfolio
  demonstration, not a HIPAA-compliant deployment.
- **SQLite, not a production database.** Fine for demo-scale read/write volume; a real
  deployment would need PostgreSQL (or similar) with proper connection pooling.
- **Free-tier LLM API constraints shaped some decisions** (e.g., model selection for
  Gemini calls), documented in the main README.
- **The rule-based safety layer in Triage has an inherent, permanent limitation:**
  keyword-based matching will always miss phrasings not explicitly listed. This is stated
  as an ongoing risk requiring continuous expansion, not a solved problem.
- **Datasets used (PlantVillage-style chest X-ray set, UCI diabetes readmission data) are
  real but not current** — the readmission dataset spans 1999-2008 US hospitals, and
  clinical practice has evolved since. A production model would need retraining on
  current, representative data.

---

## 4. What I'd Build Next (Production Roadmap)

1. Role-based authentication and audit logging
2. Migrate SQLite → PostgreSQL with proper connection pooling
3. Expand the Triage red-flag keyword library using a curated clinical terminology set
   (e.g., SNOMED CT) rather than hand-written phrase lists
4. Add a feedback loop: clinician corrections to Risk Prediction and Imaging results
   logged and used to trigger periodic retraining
5. Replace the deprecated `google.generativeai` SDK with `google.genai` across all
   GenAI-dependent modules
6. Real-time updates on the Ops Dashboard (WebSocket-based) instead of on-load fetching