from fastapi import APIRouter
from .schemas import DashboardResponse
from .service import get_dashboard_data

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=DashboardResponse)
def dashboard_summary():
    return get_dashboard_data()