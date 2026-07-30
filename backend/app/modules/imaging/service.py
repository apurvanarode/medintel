import os
import json
import io
import base64
import numpy as np
import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget
from pytorch_grad_cam.utils.image import show_cam_on_image
from app.db.database import log_imaging_event

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "..", "..", "..", "..", "models", "imaging", "pneumonia_model.pth")
CLASSES_PATH = os.path.join(BASE_DIR, "..", "..", "..", "..", "models", "imaging", "class_names.json")

with open(CLASSES_PATH) as f:
    class_names = json.load(f)

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

# --- Lazy-loaded model + Grad-CAM, only initialized on first actual request ---
_model = None
_cam = None

def _load_model():
    global _model, _cam
    if _model is None:
        _model = models.densenet121(weights=None)
        _model.classifier = nn.Linear(_model.classifier.in_features, len(class_names))
        _model.load_state_dict(torch.load(MODEL_PATH, map_location="cpu"))
        _model.eval()
        target_layers = [_model.features.denseblock4.denselayer16.conv2]
        _cam = GradCAM(model=_model, target_layers=target_layers)
    return _model, _cam


def predict_with_heatmap(image_bytes: bytes) -> dict:
    model, cam = _load_model()

    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    resized_for_display = image.resize((224, 224))
    input_tensor = transform(image).unsqueeze(0)

    with torch.no_grad():
        outputs = model(input_tensor)
        probs = torch.softmax(outputs, dim=1)
        confidence, predicted = torch.max(probs, 1)

    predicted_class = class_names[predicted.item()]
    conf_score = float(confidence.item())

    targets = [ClassifierOutputTarget(predicted.item())]
    grayscale_cam = cam(input_tensor=input_tensor, targets=targets)[0]

    rgb_img = np.array(resized_for_display).astype(np.float32) / 255.0
    cam_overlay = show_cam_on_image(rgb_img, grayscale_cam, use_rgb=True)

    overlay_img = Image.fromarray(cam_overlay)
    buffer = io.BytesIO()
    overlay_img.save(buffer, format="PNG")
    heatmap_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

    if predicted_class == "PNEUMONIA":
        interpretation = (
            f"The model detected patterns consistent with pneumonia "
            f"(confidence: {conf_score*100:.1f}%). The highlighted regions show "
            f"where the model focused its attention — typically areas of lung "
            f"opacity or consolidation. This is a screening aid, not a diagnosis; "
            f"please consult a radiologist for confirmation."
        )
    else:
        interpretation = (
            f"The model did not detect strong indicators of pneumonia "
            f"(confidence: {conf_score*100:.1f}%). The highlighted regions show "
            f"which areas most influenced this assessment. This is a screening "
            f"aid, not a diagnosis."
        )

    log_imaging_event(predicted_class, conf_score)

    return {
        "prediction": predicted_class,
        "confidence": round(conf_score, 3),
        "heatmap_base64": heatmap_base64,
        "interpretation": interpretation,
    }