# 🩺 MedIntel — AI-Powered Clinical Decision & Care Management Platform

A multi-module healthcare AI platform spanning symptom triage, diagnostic imaging,
readmission risk prediction, patient communication, and operational oversight —
built to demonstrate end-to-end AI engineering across NLP, computer vision, classical ML,
generative AI, explainability, and system design.

## Demo

*(Add a screen recording or GIF here showing all 5 modules)*

## The Problem

Clinical teams juggle disconnected tools across the patient journey — triage, diagnostic
imaging, risk tracking, and follow-up communication are often siloed, manual, or slow.
MedIntel demonstrates how a unified, AI-assisted platform could support clinicians and
patients across that full journey, while being explicit and honest about where AI
assistance should defer to human judgment.

## Modules

### 🔴 Triage Assistant
Multi-turn conversational symptom analysis powered by Google Gemini, paired with an
**independent, rule-based safety layer** that can override the LLM's classification for
known dangerous symptom combinations (e.g., chest pain + difficulty breathing). During
development, testing surfaced a real gap in this safety layer's keyword matching — found,
documented, and fixed (see [system design doc](docs/system_design.md)).

### 🩻 Imaging Diagnosis
A DenseNet121 model fine-tuned on real chest X-rays for pneumonia detection (**90% test
accuracy**), paired with **Grad-CAM heatmap visualization** so predictions aren't a black
box — clinicians can see which image regions drove each result.

### 📊 Risk Prediction
An XGBoost model predicting 30-day hospital readmission risk from structured patient data
(**ROC-AUC 0.68**, consistent with published research on this dataset), with **SHAP-based
explainability** showing exactly which factors drove each prediction, plus a **custom
priority-queue algorithm** (a max-heap) for allocating limited care-team follow-up slots to
the highest-risk patients first.

### 💬 Care Companion
A RAG-style chatbot grounded strictly in a patient's own discharge summary, with a tested
safety guardrail that flags any response touching medication changes or symptom danger
assessment as requiring clinician confirmation — regardless of how confident or correct the
underlying answer is.

### 📈 Operations Dashboard
A live analytics view aggregating real usage across all four other modules — triage volume
by urgency, imaging result trends, and risk-level distribution — backed by real logging
infrastructure (seeded with realistic historical data for demo purposes).

## Architecture
[React + Tailwind Frontend]
│
▼
[FastAPI Backend] — modular structure, one module per capability
│
├── /api/triage
├── /api/imaging
├── /api/risk
├── /api/chatbot
└── /api/dashboard
│
▼
[SQLite] 

Full architectural reasoning, engineering tradeoffs, and honestly-documented limitations
are in [`docs/system_design.md`](docs/system_design.md) — including two real bugs found
through testing and how they were fixed.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Tailwind CSS v4, Framer Motion, Recharts |
| Backend | FastAPI (modular, one router per module) |
| NLP / GenAI | Google Gemini API |
| Computer Vision | PyTorch, DenseNet121, Grad-CAM |
| Classical ML | XGBoost, scikit-learn, SHAP |
| Database | SQLite |
| DSA | Custom max-heap priority queue for resource allocation |
| Training Environment | Google Colab (free T4 GPU) |

## Datasets Used

- **Chest X-Ray Images (Pneumonia)** — Kaggle (Paul Mooney), ~5,800 real chest X-rays
- **Diabetes 130-US Hospitals (1999-2008)** — UCI / Kaggle, ~100,000 real patient encounters

Both are real, publicly available, de-identified datasets — commonly used in healthcare ML
research and teaching.

## How to Run Locally

### 1. Clone the repo
```bash
git clone https://github.com/apurvanarode/medintel.git
cd medintel
```

### 2. Backend setup
```bash
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
```

Create a `.env` file in the project root:
GEMINI_API_KEY=your-key-here

Trained model files are included directly in this repo under `models/imaging/` and
`models/risk_prediction/` — no separate download needed.

Run the backend:
```bash
cd backend
uvicorn app.main:app --reload
```

### 3. Frontend setup (in a new terminal)
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173`.

## What I'd Build Next

- Role-based authentication and audit logging
- Migrate SQLite → PostgreSQL
- Clinician feedback loop feeding automated model retraining
- Migrate from the deprecated `google.generativeai` SDK to `google.genai`
- Real-time dashboard updates via WebSockets

See [`docs/system_design.md`](docs/system_design.md) for the complete reasoning.

## Project Structure
medintel/
├── backend/
│ └── app/
│ ├── modules/
│ │ ├── triage/
│ │ ├── imaging/
│ │ ├── risk_prediction/
│ │ ├── chatbot/
│ │ └── dashboard_api/
│ └── db/
├── frontend/
│ └── src/
│ ├── components/
│ └── pages/
├── models/
├── data/
├── notebooks/
└── docs/
└── system_design.md