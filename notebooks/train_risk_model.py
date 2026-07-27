import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import xgboost as xgb
from sklearn.metrics import classification_report, roc_auc_score
import joblib
import json
import os

# --- Load data ---
DATA_PATH = "../data/raw/readmission/diabetic_data.csv"
df = pd.read_csv(DATA_PATH)

print("Original shape:", df.shape)
print(df['readmitted'].value_counts())

# --- Target: binarize to "readmitted within 30 days" vs not ---
# This is the clinically meaningful target (hospitals get penalized specifically for <30 day readmissions)
df['target'] = (df['readmitted'] == '<30').astype(int)

# --- Drop columns that are IDs, leak the target, or are mostly missing ---
drop_cols = ['encounter_id', 'patient_nbr', 'readmitted', 'weight', 'payer_code', 'medical_specialty']
df = df.drop(columns=[c for c in drop_cols if c in df.columns])

# --- Replace '?' with NaN, then handle missing values ---
df = df.replace('?', np.nan)

# --- Select a focused, clinically meaningful feature set ---
# (Full dataset has 45+ messy categorical columns; we scope down to the
# most predictive, interpretable ones for a clean SHAP story)
feature_cols = [
    'race', 'gender', 'age', 'admission_type_id', 'discharge_disposition_id',
    'admission_source_id', 'time_in_hospital', 'num_lab_procedures',
    'num_procedures', 'num_medications', 'number_outpatient',
    'number_emergency', 'number_inpatient', 'number_diagnoses',
    'max_glu_serum', 'A1Cresult', 'insulin', 'change', 'diabetesMed'
]
feature_cols = [c for c in feature_cols if c in df.columns]

X = df[feature_cols].copy()
y = df['target']

# --- Encode categoricals ---
encoders = {}
for col in X.columns:
    # Try converting to numeric; if it fails, treat as categorical
    numeric_version = pd.to_numeric(X[col], errors='coerce')
    is_truly_numeric = numeric_version.notna().sum() >= (0.9 * X[col].notna().sum())

    if is_truly_numeric:
        X[col] = numeric_version
        X[col] = X[col].fillna(X[col].median())
    else:
        X[col] = X[col].fillna('Unknown')
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col].astype(str))
        encoders[col] = le
        
print("\nFinal feature set:", list(X.columns))
print("Target distribution:", y.value_counts(normalize=True))

# --- Train/test split ---
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# --- Train XGBoost with class imbalance handling ---
scale_pos_weight = (y_train == 0).sum() / (y_train == 1).sum()
model = xgb.XGBClassifier(
    n_estimators=200,
    max_depth=5,
    learning_rate=0.05,
    scale_pos_weight=scale_pos_weight,
    eval_metric='auc',
    random_state=42
)
model.fit(X_train, y_train)

# --- Evaluate ---
y_pred = model.predict(X_test)
y_proba = model.predict_proba(X_test)[:, 1]

print("\n--- Classification Report ---")
print(classification_report(y_test, y_pred))
print("ROC-AUC:", roc_auc_score(y_test, y_proba))

# --- Save everything needed for inference ---
os.makedirs("../models/risk_prediction", exist_ok=True)
joblib.dump(model, "../models/risk_prediction/risk_model.pkl")
joblib.dump(encoders, "../models/risk_prediction/encoders.pkl")

with open("../models/risk_prediction/feature_cols.json", "w") as f:
    json.dump(feature_cols, f)

# Save median values used for imputation (needed at inference time too)
medians = {col: float(X[col].median()) for col in feature_cols if col not in encoders}
with open("../models/risk_prediction/medians.json", "w") as f:
    json.dump(medians, f)

print("\nModel and artifacts saved.")