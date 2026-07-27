from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.modules.triage.router import router as triage_router
from app.modules.imaging.router import router as imaging_router
from app.modules.risk_prediction.router import router as risk_router

app = FastAPI(title="MedIntel API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(triage_router)
app.include_router(imaging_router)
app.include_router(risk_router)

@app.get("/")
def root():
    return {"message": "MedIntel API is running"}