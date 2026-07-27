from pydantic import BaseModel

class ImagingResponse(BaseModel):
    prediction: str
    confidence: float
    heatmap_base64: str
    interpretation: str