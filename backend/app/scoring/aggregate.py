from typing import List, Dict, Any, Tuple

def aggregate_team_score(member_scores: List[float], method: str = "mean") -> Tuple[float, List[str]]:
    """
    Aggregates individual member scores into a team score[cite: 5].
    Returns: (team_score, notes)
    """
    notes = []
    member_count = len(member_scores)
    
    if member_count == 0:
        return 0.0, ["Empty team"]
        
    if member_count == 1:
        notes.append("Solo team")
    elif member_count >= 5:
        notes.append("Large team (5+ members)")

    if method == "mean":
        team_score = sum(member_scores) / member_count
    elif method == "highest_member": # 'at least one member above threshold' variant
        team_score = max(member_scores)
    else:
        # Default fallback
        team_score = sum(member_scores) / member_count
        
    return round(team_score, 2), notes