from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class PatientData(BaseModel):
    patient_id: str
    race: str = "Unknown"
    gender: str = "Male"
    age: str = "[50-60)"
    admission_type_id: int = 1
    discharge_disposition_id: int = 1
    admission_source_id: int = 1
    time_in_hospital: int = 3
    num_lab_procedures: int = 40
    num_procedures: int = 1
    num_medications: int = 15
    number_outpatient: int = 0
    number_emergency: int = 0
    number_inpatient: int = 0
    number_diagnoses: int = 5
    max_glu_serum: str = "None"
    A1Cresult: str = "None"
    insulin: str = "No"
    change: str = "No"
    diabetesMed: str = "Yes"

class RiskFactor(BaseModel):
    feature: str
    impact: float
    value: str

class RiskResponse(BaseModel):
    patient_id: str
    risk_score: float
    risk_level: str  # "low", "moderate", "high"
    top_risk_factors: List[RiskFactor]

class BatchPatientRequest(BaseModel):
    patients: List[PatientData]
    available_staff_slots: int = 5

class PrioritizedPatient(BaseModel):
    patient_id: str
    risk_score: float
    risk_level: str
    priority_rank: int
    assigned: bool

class BatchRiskResponse(BaseModel):
    prioritized_patients: List[PrioritizedPatient]