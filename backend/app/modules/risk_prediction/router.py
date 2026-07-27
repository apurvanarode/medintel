from fastapi import APIRouter
from .schemas import PatientData, RiskResponse, BatchPatientRequest, BatchRiskResponse
from .service import predict_risk, predict_batch_with_priority

router = APIRouter(prefix="/api/risk", tags=["Risk Prediction"])

@router.post("/predict", response_model=RiskResponse)
def predict(patient: PatientData):
    patient_dict = patient.model_dump()
    result = predict_risk(patient_dict)
    return RiskResponse(patient_id=patient.patient_id, **result)

@router.post("/prioritize", response_model=BatchRiskResponse)
def prioritize(request: BatchPatientRequest):
    patients = [p.model_dump() for p in request.patients]
    prioritized = predict_batch_with_priority(patients, request.available_staff_slots)
    return BatchRiskResponse(prioritized_patients=prioritized)