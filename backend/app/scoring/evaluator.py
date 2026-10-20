from typing import List, Dict, Any
from backend.app.scoring.weighted import calculate_member_score
from backend.app.scoring.aggregate import aggregate_team_score
from backend.app.scoring.missing import apply_missing_policy
from backend.app.scoring.eligibility import evaluate_eligibility
from backend.app.scoring.ranking import rank_teams

def evaluate(
    teams: List[Dict[str, Any]], 
    member_values: Dict[str, Dict[str, Any]], 
    config: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """
    Fast, pure evaluation engine optimized for 1000+ team scale.
    """
    criteria_list = config.get("criteria", [])
    weights = {c["name"]: float(c["weight"]) for c in criteria_list}
    criteria_names = list(weights.keys())
    
    top_x = int(config.get("top_x", 10))
    missing_policy = config.get("missing_policy", "redistribute")
    aggregation_method = config.get("aggregation", "mean")
    tie_break = config.get("tie_break", ["team_score", "team_id"])
    rules = config.get("eligibility_rules", [])
    has_rules = bool(rules)

    results = []
    eligible_teams = []
    empty_breakdown = {c: 0.0 for c in criteria_names}

    for team in teams:
        team_id = str(team.get("team_id", ""))
        team_name = team.get("team_name", "")
        members = team.get("members", [])

        # 1. Fast-path Eligibility Check
        if has_rules:
            status, failed_rules = evaluate_eligibility(team, [], rules)
            if status in ("Ineligible", "Needs review"):
                results.append({
                    "team_id": team_id,
                    "team_name": team_name,
                    "rank": None,
                    "team_score": 0.0,
                    "status": status,
                    "criterion_breakdown": empty_breakdown.copy(),
                    "failed_rules": failed_rules,
                    "missing_warnings": [],
                    "explanation": f"{status} due to eligibility rules or missing mandatory signals."
                })
                continue

        # 2. Vectorized/Pre-allocated Member Scoring
        member_scores = []
        team_missing_warnings = set()
        team_breakdown_totals = {c: 0.0 for c in criteria_names}

        for member in members:
            email = member.get("email", "")
            m_vals = member_values.get(email, {})
            
            adj_values, adj_weights, m_warnings = apply_missing_policy(m_vals, weights, missing_policy)
            if m_warnings:
                team_missing_warnings.update(m_warnings)
            
            score, breakdown = calculate_member_score(adj_values, adj_weights)
            member_scores.append(score)
            
            for c in criteria_names:
                team_breakdown_totals[c] += breakdown.get(c, 0.0)

        mem_count = len(members) or 1
        inv_mem_count = 1.0 / mem_count
        for c in criteria_names:
            team_breakdown_totals[c] = round(team_breakdown_totals[c] * inv_mem_count, 2)

        # 3. Team Aggregation
        team_score, notes = aggregate_team_score(member_scores, aggregation_method)
        if notes:
            team_missing_warnings.update(notes)

        eligible_teams.append({
            "team_id": team_id,
            "team_name": team_name,
            "team_score": team_score,
            "criterion_breakdown": team_breakdown_totals,
            "failed_rules": [],
            "missing_warnings": sorted(team_missing_warnings),
            "explanation": ""
        })

    # 4. Deterministic Ranking
    ranked_eligible = rank_teams(eligible_teams, top_x, tie_break)
    results.extend(ranked_eligible)

    return results