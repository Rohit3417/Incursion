from typing import List, Dict, Any

def rank_teams(teams: List[Dict[str, Any]], top_x: int, tie_break_chain: List[str]) -> List[Dict[str, Any]]:
    """
    Ranks eligible teams based on team_score and applies the tie-break chain.
    Numeric criteria/scores sort descending; string identifiers (team_id) sort ascending.
    """
    def sort_key(team: Dict[str, Any]):
        key_parts = []
        for key in tie_break_chain:
            if key == "team_id":
                # Ascending lexicographical order for deterministic tie-breaking
                key_parts.append(str(team.get("team_id", "")))
            else:
                # Negate numeric scores so ascending sort places highest scores first
                val = team.get(key)
                if val is None and "criterion_breakdown" in team:
                    val = team["criterion_breakdown"].get(key, 0.0)
                try:
                    key_parts.append(-float(val if val is not None else 0.0))
                except (ValueError, TypeError):
                    key_parts.append(str(val))
        # Always guarantee team_id is the final tie-breaker
        if "team_id" not in tie_break_chain:
            key_parts.append(str(team.get("team_id", "")))
        return tuple(key_parts)

    teams.sort(key=sort_key)

    ranked_teams = []
    for idx, team in enumerate(teams, start=1):
        team["rank"] = idx
        team["status"] = "Shortlisted" if idx <= top_x else "Not shortlisted"
        ranked_teams.append(team)

    return ranked_teams