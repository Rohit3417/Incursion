import hashlib
import json
from fastapi import APIRouter, HTTPException
from backend.app.db.repository import get_run, get_dataset
from backend.app.core.hashing import compute_run_hash
from backend.app.core.pipeline import run_evaluation_pipeline

router = APIRouter()

@router.post("/{run_id}/verify")
def verify_run(run_id: str):
    """
    Re-runs stored dataset and configsnapshot through the evaluation pipeline
    and verifies whether the computed run_hash and canonical output match identically.
    """
    run = get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    dataset = get_dataset(run["dataset_id"])
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    config_snapshot = run["config_snapshot_json"]
    teams = dataset["teams_json"]

    recomputed_run_hash = compute_run_hash(run["dataset_id"], config_snapshot)
    recomputed_results = run_evaluation_pipeline(teams, config_snapshot)

    stored_results_str = json.dumps(run["results_json"], sort_keys=True)
    recomputed_results_str = json.dumps(recomputed_results, sort_keys=True)

    stored_output_hash = hashlib.sha256(stored_results_str.encode("utf-8")).hexdigest()
    recomputed_output_hash = hashlib.sha256(recomputed_results_str.encode("utf-8")).hexdigest()

    hash_matches = (recomputed_run_hash == run["run_hash"]) and (stored_output_hash == recomputed_output_hash)

    return {
        "status": "success",
        "run_id": run_id,
        "matches": hash_matches,
        "stored_run_hash": run["run_hash"],
        "recomputed_run_hash": recomputed_run_hash,
        "stored_output_hash": stored_output_hash,
        "recomputed_output_hash": recomputed_output_hash
    }