from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Literal
from backend.app.db.repository import add_override, list_overrides, get_run

router = APIRouter()

class OverrideRequest(BaseModel):
    team_id: str
    action: Literal["pin", "exclude", "waitlist"]
    reason: str

@router.post("/{run_id}/overrides")
def create_override(run_id: str, payload: OverrideRequest):
    """
    Records a manual override (pin, exclude, waitlist) with an audit reason[cite: 2, 6].
    Never rewrites stored automated results[cite: 2, 6].
    """
    run = get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    saved = add_override(
        run_id=run_id,
        team_id=payload.team_id,
        action=payload.action,
        reason=payload.reason
    )
    return {"status": "success", "data": saved}

@router.get("/{run_id}/overrides")
def get_run_overrides(run_id: str):
    """Lists all manual overrides applied to a run[cite: 6]."""
    overrides = list_overrides(run_id)
    return {"status": "success", "data": overrides}

@router.get("/{run_id}/final")
def get_final_order(run_id: str):
    """
    Computes the final team order applying overrides while preserving 
    the original automated_rank beside final_rank[cite: 6].
    """
    run = get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    results = [dict(r) for r in run.get("results_json", [])]
    overrides = list_overrides(run_id)

    # Keep only the latest override per team_id if multiple exist
    latest_overrides = {}
    for ov in overrides:
        latest_overrides[ov["team_id"]] = ov

    pinned = []
    regular = []
    waitlisted = []
    excluded = []

    for team in results:
        t_id = team["team_id"]
        team["automated_rank"] = team.get("rank")
        team["automated_status"] = team.get("status")
        
        if t_id in latest_overrides:
            ov = latest_overrides[t_id]
            action = ov["action"]
            team["override_action"] = action
            team["override_reason"] = ov["reason"]

            if action == "pin":
                team["status"] = "Shortlisted (Pinned)"
                pinned.append(team)
            elif action == "waitlist":
                team["status"] = "Waitlisted"
                waitlisted.append(team)
            elif action == "exclude":
                team["status"] = "Excluded"
                excluded.append(team)
        else:
            team["override_action"] = None
            team["override_reason"] = None
            regular.append(team)

    # Re-calculate final_rank for active teams (Pinned first, then Regular, then Waitlisted)
    final_list = []
    current_final_rank = 1

    for group in [pinned, regular, waitlisted]:
        for team in group:
            if team["automated_status"] in ["Ineligible"] and not team["override_action"]:
                team["final_rank"] = None
            else:
                team["final_rank"] = current_final_rank
                current_final_rank += 1
            final_list.append(team)

    for team in excluded:
        team["final_rank"] = None
        final_list.append(team)

    return {"status": "success", "run_id": run_id, "data": final_list}