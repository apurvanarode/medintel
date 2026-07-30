import os
import json
import joblib
import numpy as np
import pandas as pd
import shap
from .priority_queue import allocate_follow_up_slots
from app.db.database import log_risk_event

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "..", "..", "..", "..", "models", "risk_prediction")

with open(os.path.join(MODELS_DIR, "feature_cols.json")) as f:
    feature_cols = json.load(f)

with open(os.path.join(MODELS_DIR, "medians.json")) as f:
    medians = json.load(f)

# --- Lazy-loaded model, encoders, and SHAP explainer ---
_model = None
_encoders = None
_explainer = None

def _load_model():
    global _model, _encoders, _explainer
    if _model is None:
        _model = joblib.load(os.path.join(MODELS_DIR, "risk_model.pkl"))
        _encoders = joblib.load(os.path.join(MODELS_DIR, "encoders.pkl"))
        _explainer = shap.TreeExplainer(_model)
    return _model, _encoders, _explainer


def _prepare_row(patient_dict: dict, encoders: dict) -> pd.DataFrame:
    row = {}
    for col in feature_cols:
        raw_value = patient_dict.get(col)
        if col in encoders:
            le = encoders[col]
            str_value = str(raw_value) if raw_value is not None else "Unknown"
            if str_value not in le.classes_:
                str_value = "Unknown" if "Unknown" in le.classes_ else le.classes_[0]
            row[col] = le.transform([str_value])[0]
        else:
            row[col] = raw_value if raw_value is not None else medians.get(col, 0)
    return pd.DataFrame([row])[feature_cols]


def predict_risk(patient_dict: dict) -> dict:
    model, encoders, explainer = _load_model()

    X_row = _prepare_row(patient_dict, encoders)
    risk_score = float(model.predict_proba(X_row)[0][1])

    if risk_score >= 0.5:
        risk_level = "high"
    elif risk_score >= 0.3:
        risk_level = "moderate"
    else:
        risk_level = "low"

    shap_values = explainer.shap_values(X_row)
    if isinstance(shap_values, list):
        shap_values = shap_values[1]

    contributions = shap_values[0]
    feature_impact = list(zip(feature_cols, contributions))
    feature_impact.sort(key=lambda x: abs(x[1]), reverse=True)

    top_factors = []
    for feature, impact in feature_impact[:5]:
        raw_value = patient_dict.get(feature, medians.get(feature, "N/A"))
        top_factors.append({
            "feature": feature,
            "impact": round(float(impact), 4),
            "value": str(raw_value),
        })

    log_risk_event(patient_dict.get("patient_id", "unknown"), risk_score, risk_level)

    return {
        "risk_score": round(risk_score, 4),
        "risk_level": risk_level,
        "top_risk_factors": top_factors,
    }


def predict_batch_with_priority(patients: list, available_slots: int) -> list:
    scored = []
    for p in patients:
        result = predict_risk(p)
        scored.append((p["patient_id"], result["risk_score"], result["risk_level"]))

    scores_only = [(pid, score) for pid, score, _ in scored]
    prioritized = allocate_follow_up_slots(scores_only, available_slots)

    risk_level_lookup = {pid: level for pid, _, level in scored}
    for item in prioritized:
        item["risk_level"] = risk_level_lookup[item["patient_id"]]

    return prioritized