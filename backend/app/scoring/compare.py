from typing import List, Dict, Any
from backend.app.scoring.evaluator import evaluate

def compare_configs(
    teams: List[Dict[str, Any]],
    member_values_map: Dict[str, Dict[str, Any]],
    config_a: Dict[str, Any],
    config_b: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """
    Evaluates a single run's stored member criterion values under two configurations
    and returns a rank-difference table.
    """
    results_a = evaluate(teams, member_values_map, config_a)
    results_b = evaluate(teams, member_values_map, config_b)

    map_a = {r["team_id"]: r for r in results_a}
    map_b = {r["team_id"]: r for r in results_b}

    comparison_table = []
    for team in teams:
        t_id = team["team_id"]
        ra = map_a.get(t_id, {})
        rb = map_b.get(t_id, {})

        rank_a = ra.get("rank")
        rank_b = rb.get("rank")
        score_a = ra.get("team_score", 0.0)
        score_b = rb.get("team_score", 0.0)

        if rank_a is not None and rank_b is not None:
            rank_diff = rank_a - rank_b  # Positive means higher rank in Config B
        else:
            rank_diff = 0

        comparison_table.append({
            "team_id": t_id,
            "team_name": team["team_name"],
            "rank_a": rank_a,
            "score_a": score_a,
            "status_a": ra.get("status"),
            "rank_b": rank_b,
            "score_b": score_b,
            "status_b": rb.get("status"),
            "rank_diff": rank_diff,
            "score_diff": round(score_b - score_a, 2),
            "status_changed": ra.get("status") != rb.get("status")
        })

    # Sort primarily by rank_a (placing unranked at the bottom)
    comparison_table.sort(key=lambda x: (x["rank_a"] is None, x["rank_a"] or 999999))
    return comparison_table


def compare_two_teams(team_a_result: Dict[str, Any], team_b_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes a criterion-by-criterion difference between two teams from a run.
    """
    bd_a = team_a_result.get("criterion_breakdown", {})
    bd_b = team_b_result.get("criterion_breakdown", {})
    all_criteria = sorted(set(bd_a.keys()) | set(bd_b.keys()))

    criterion_diffs = []
    for c in all_criteria:
        val_a = bd_a.get(c, 0.0)
        val_b = bd_b.get(c, 0.0)
        criterion_diffs.append({
            "criterion": c,
            "team_a_points": val_a,
            "team_b_points": val_b,
            "difference": round(val_a - val_b, 2)
        })

    return {
        "team_a": {"team_id": team_a_result.get("team_id"), "team_name": team_a_result.get("team_name"), "score": team_a_result.get("team_score")},
        "team_b": {"team_id": team_b_result.get("team_id"), "team_name": team_b_result.get("team_name"), "score": team_b_result.get("team_score")},
        "score_diff": round(team_a_result.get("team_score", 0.0) - team_b_result.get("team_score", 0.0), 2),
        "criteria_comparison": criterion_diffs
    }