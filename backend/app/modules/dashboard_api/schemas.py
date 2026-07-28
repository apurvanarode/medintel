from pydantic import BaseModel
from typing import List, Dict

class SummaryStats(BaseModel):
    total_triage_events: int
    total_imaging_events: int
    total_risk_events: int
    emergency_count_7d: int
    pneumonia_count_7d: int
    high_risk_count_7d: int

class DailyTrendPoint(BaseModel):
    date: str
    routine: int = 0
    urgent: int = 0
    emergency: int = 0

class ImagingTrendPoint(BaseModel):
    date: str
    normal: int = 0
    pneumonia: int = 0

class RiskDistributionPoint(BaseModel):
    level: str
    count: int

class DashboardResponse(BaseModel):
    summary: SummaryStats
    triage_trend: List[DailyTrendPoint]
    imaging_trend: List[ImagingTrendPoint]
    risk_distribution: List[RiskDistributionPoint]