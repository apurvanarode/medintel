from fastapi import APIRouter, UploadFile, File
from .schemas import ImagingResponse
from .service import predict_with_heatmap

router = APIRouter(prefix="/api/imaging", tags=["Imaging"])

@router.post("/analyze", response_model=ImagingResponse)
async def analyze_image(file: UploadFile = File(...)):
    image_bytes = await file.read()
    result = predict_with_heatmap(image_bytes)
    return ImagingResponse(**result)