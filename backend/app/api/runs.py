from fastapi import APIRouter, HTTPException
from backend.app.db.repository import save_run, get_run, list_runs, get_dataset, get_config
from backend.app.core.hashing import compute_run_hash
from backend.app.core.pipeline import run_evaluation_pipeline

router = APIRouter()

@router.post("/")
def create_run(dataset_id: str, config_id: str):
    """
    Loads dataset and config, evaluates using the real pipeline, computes run_hash, and saves run[cite: 6].
    """
    dataset = get_dataset(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    config_record = get_config(config_id)
    if not config_record:
        raise HTTPException(status_code=404, detail="Configuration not found")
        
    config_json = config_record["config_json"]
    teams = dataset["teams_json"]

    run_hash = compute_run_hash(dataset_id, config_json)

    # Use the real pipeline integrating signals and evaluator
    results = run_evaluation_pipeline(teams, config_json)

    saved = save_run(
        dataset_id=dataset_id,
        config_snapshot_json=config_json,
        run_hash=run_hash,
        results_json=results
    )
    
    return {"status": "success", "run_id": saved["id"]}

@router.get("/")
def get_all_runs():
    runs = list_runs()
    return {"status": "success", "data": runs}

@router.get("/{run_id}")
def get_single_run(run_id: str):
    run = get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return {"status": "success", "data": run}