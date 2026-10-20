from typing import Dict, Any, Tuple

def calculate_member_score(criterion_values: Dict[str, Any], weights: Dict[str, float]) -> Tuple[float, Dict[str, float]]:
    """
    Pure function to calculate a single member's score[cite: 4].
    Expects criterion_values to be a dict of {criterion_name: value (0-100) or "MISSING"}.
    Expects weights to be a dict of {criterion_name: weight_percentage (0-100)}.
    """
    total_score = 0.0
    contribution_breakdown = {}

    for criterion, weight in weights.items():
        value = criterion_values.get(criterion, "MISSING")
        
        # If MISSING, it contributes 0 to the raw score at this stage. 
        # The missing-data policy (redistribution, penalty) is handled at the team aggregation level.
        if value == "MISSING" or not isinstance(value, (int, float)):
            contribution = 0.0
        else:
            contribution = (value / 100.0) * weight
            
        contribution_breakdown[criterion] = round(contribution, 2)
        total_score += contribution

    return round(total_score, 2), contribution_breakdown