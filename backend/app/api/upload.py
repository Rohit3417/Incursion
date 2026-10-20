from fastapi import APIRouter, UploadFile, File, HTTPException
from backend.app.ingest.loader import load_file
from backend.app.ingest.validate import validate_dataset
from backend.app.db.repository import save_dataset, get_dataset
import hashlib
import json

router = APIRouter()

@router.post("/")
async def upload_dataset(file: UploadFile = File(...)):
    """Accepts file, runs loader and validator, saves dataset, and returns report[cite: 5]."""
    if not file.filename.endswith((".csv", ".json")):
        raise HTTPException(status_code=400, detail="Only CSV and JSON files are supported.[cite: 5]")

    file_bytes = await file.read()
    
    try:
        load_result = load_file(file_bytes, file.filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Malformed file: {str(e)}[cite: 5]")

    validation_report = validate_dataset(load_result)
    
    teams_dict = [team.dict() for team in load_result.teams]
    content_hash = hashlib.sha256(file_bytes).hexdigest()
    
    try:
        saved_dataset = save_dataset(
            name=file.filename,
            content_hash=content_hash,
            teams_json=teams_dict,
            validation_report_json=validation_report
        )
    except Exception as e:
         raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    return {
        "dataset_id": saved_dataset["id"],
        "row_count": load_result.row_count,
        "preview": load_result.preview,
        "validation_report": validation_report
    }

@router.get("/{dataset_id}/teams")
def get_dataset_teams(dataset_id: str):
    dataset = get_dataset(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return {"status": "success", "teams": dataset["teams_json"]}