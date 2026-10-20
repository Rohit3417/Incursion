from typing import List, Dict, Any
from copy import deepcopy
from backend.app.scoring.evaluator import evaluate

def compute_whatif_deltas(
    baseline_results: List[Dict[str, Any]], 
    new_results: List[Dict[str, Any]], 
    top_x: int
) -> List[Dict[str, Any]]:
    """
    Compares a re-ranked result set against a baseline run to compute old_rank, new_rank,
    rank_delta, and whether a team entered or left the Top-X cutoff[cite: 7].
    """
    baseline_map = {r["team_id"]: r for r in baseline_results}
    enriched = []

    for r in new_results:
        t_id = r["team_id"]
        base = baseline_map.get(t_id, {})
        
        old_rank = base.get("rank")
        new_rank = r.get("rank")
        old_status = base.get("status")
        new_status = r.get("status")

        if old_rank is not None and new_rank is not None:
            # Positive delta means the team improved in rank (e.g., 12 -> 8 = +4)
            rank_delta = old_rank - new_rank
        else:
            rank_delta = 0

        was_shortlisted = old_status == "Shortlisted" or (old_rank is not None and old_rank <= top_x)
        is_shortlisted = new_status == "Shortlisted" or (new_rank is not None and new_rank <= top_x)

        entered_top_x = not was_shortlisted and is_shortlisted
        left_top_x = was_shortlisted and not is_shortlisted

        r_copy = dict(r)
        r_copy["old_rank"] = old_rank
        r_copy["new_rank"] = new_rank
        r_copy["rank_delta"] = rank_delta
        r_copy["entered_top_x"] = entered_top_x
        r_copy["left_top_x"] = left_top_x
        enriched.append(r_copy)

    return enriched


def run_sensitivity_check(
    teams: List[Dict[str, Any]], 
    member_values_map: Dict[str, Dict[str, Any]], 
    config_dict: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """
    Moves each criterion weight by +5 and -5 points (redistributing across others to keep sum=100)
    and lists teams whose Shortlisted status changes[cite: 7].
    """
    baseline_results = evaluate(teams, member_values_map, config_dict)
    base_status_map = {r["team_id"]: r.get("status") for r in baseline_results}
    
    criteria = config_dict.get("criteria", [])
    if len(criteria) < 2:
        return []

    flips = []

    for idx, crit in enumerate(criteria):
        for shift in [5.0, -5.0]:
            new_weight = crit["weight"] + shift
            if new_weight < 0 or new_weight > 100:
                continue

            test_config = deepcopy(config_dict)
            test_criteria = test_config["criteria"]
            test_criteria[idx]["weight"] = new_weight

            # Distribute the opposite shift across the remaining criteria proportionally
            other_indices = [i for i in range(len(test_criteria)) if i != idx]
            other_sum = sum(test_criteria[i]["weight"] for i in other_indices)

            if other_sum > 0:
                for i in other_indices:
                    share = test_criteria[i]["weight"] / other_sum
                    test_criteria[i]["weight"] = round(test_criteria[i]["weight"] - (shift * share), 4)
            else:
                even_split = -shift / len(other_indices)
                for i in other_indices:
                    test_criteria[i]["weight"] = round(test_criteria[i]["weight"] + even_split, 4)

            perturbed_results = evaluate(teams, member_values_map, test_config)
            changed_teams = [
                {
                    "team_id": r["team_id"],
                    "team_name": r["team_name"],
                    "old_status": base_status_map.get(r["team_id"]),
                    "new_status": r.get("status")
                }
                for r in perturbed_results
                if r.get("status") != base_status_map.get(r["team_id"])
            ]

            if changed_teams:
                flips.append({
                    "criterion": crit["name"],
                    "weight_shift": f"+{int(shift)}" if shift > 0 else str(int(shift)),
                    "affected_teams": changed_teams
                })

    return flips