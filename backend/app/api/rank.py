from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.app.scoring.config_schema import Configuration
from backend.app.db.repository import get_run, get_dataset
from backend.app.scoring.evaluator import evaluate
from backend.app.scoring.whatif import compute_whatif_deltas, run_sensitivity_check

router = APIRouter()

class RankRequest(BaseModel):
    run_id: str
    config: Configuration
    include_sensitivity: bool = False

@router.post("/")
def recompute_ranking(payload: RankRequest):
    """
    Recomputes ranking from stored member criterion values without saving to database,
    returning old_rank, new_rank, and Top-X entry/exit deltas against the baseline run.
    """
    run_record = get_run(payload.run_id)
    if not run_record:
        raise HTTPException(status_code=404, detail="Run not found")
        
    dataset_record = get_dataset(run_record["dataset_id"])
    if not dataset_record:
        raise HTTPException(status_code=404, detail="Dataset not found")

    teams = dataset_record["teams_json"]
    baseline_results = run_record["results_json"]
    
    member_values_map = {}
    for r in baseline_results:
        team_member_vals = r.get("_member_criterion_values", {})
        for email, vals in team_member_vals.items():
            member_values_map[email] = vals

    config_dict = payload.config.dict()
    new_results = evaluate(teams, member_values_map, config_dict)
    
    # Enrich with what-if comparison against the baseline run[cite: 7]
    whatif_results = compute_whatif_deltas(baseline_results, new_results, payload.config.top_x)
    
    response = {
        "status": "success",
        "data": whatif_results
    }

    if payload.include_sensitivity:
        response["sensitivity"] = run_sensitivity_check(teams, member_values_map, config_dict)

    return response