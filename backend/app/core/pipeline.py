from backend.app.scoring.evaluator import evaluate
from backend.app.scoring.signal_mapping import map_signals_to_criteria
from backend.app.scoring.explaination import generate_explanations
from integrations.signals import build_member_signals
from integrations.duplicates import detect_cross_team_duplicates

def run_evaluation_pipeline(teams: list, config_json: dict) -> list:
    """
    Orchestrates reading signals, mapping to criteria, evaluating, detecting cross-team
    duplicates, and generating deterministic explanations before saving a run.
    """
    all_keywords = []
    for criterion in config_json.get("criteria", []):
        all_keywords.extend(criterion.get("keywords", []))
        
    all_keywords = list(set(all_keywords))
    member_values_map = {}

    for team in teams:
        for member in team.get("members", []):
            email = member.get("email")
            raw_signals = build_member_signals(member, all_keywords)
            criterion_values = map_signals_to_criteria(raw_signals, config_json.get("criteria", []))
            member_values_map[email] = criterion_values

    # 1. Evaluate and rank teams
    results = evaluate(teams, member_values_map, config_json)
    
    # 2. Add cross-team duplicate warnings
    dup_flags = detect_cross_team_duplicates(teams)

    for r in results:
        t_id = str(r["team_id"])
        if t_id in dup_flags:
            r.setdefault("missing_warnings", []).extend(dup_flags[t_id])
        team_obj = next((t for t in teams if str(t["team_id"]) == t_id), None)
        if team_obj:
            r["_member_criterion_values"] = {
                m["email"]: member_values_map.get(m["email"], {}) for m in team_obj.get("members", [])
            }

    # 3. Call M1's explain.py before saving the run
    top_x = config_json.get("top_x", 10)
    results = generate_explanations(results, top_x)

    return results