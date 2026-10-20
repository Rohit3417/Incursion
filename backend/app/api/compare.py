from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.app.scoring.config_schema import Configuration
from backend.app.db.repository import get_run, get_dataset
from backend.app.scoring.compare import compare_configs, compare_two_teams

router = APIRouter()

class ConfigCompareRequest(BaseModel):
    run_id: str
    config_a: Configuration
    config_b: Configuration
    team_a_id: Optional[str] = None
    team_b_id: Optional[str] = None

@router.post("/")
def run_config_comparison(payload: ConfigCompareRequest):
    """
    Compares two configurations on the same run's dataset and optionally includes
    pairwise comparison of two specific teams.
    """
    run_record = get_run(payload.run_id)
    if not run_record:
        raise HTTPException(status_code=404, detail="Run not found")

    dataset_record = get_dataset(run_record["dataset_id"])
    if not dataset_record:
        raise HTTPException(status_code=404, detail="Dataset not found")

    teams = dataset_record["teams_json"]
    original_results = run_record["results_json"]

    member_values_map = {}
    for r in original_results:
        for email, vals in r.get("_member_criterion_values", {}).items():
            member_values_map[email] = vals

    diff_table = compare_configs(
        teams,
        member_values_map,
        payload.config_a.dict(),
        payload.config_b.dict()
    )

    response = {
        "status": "success",
        "run_id": payload.run_id,
        "comparison": diff_table
    }

    if payload.team_a_id and payload.team_b_id:
        res_map = {r["team_id"]: r for r in original_results}
        if payload.team_a_id in res_map and payload.team_b_id in res_map:
            response["pairwise"] = compare_two_teams(res_map[payload.team_a_id], res_map[payload.team_b_id])

    return response