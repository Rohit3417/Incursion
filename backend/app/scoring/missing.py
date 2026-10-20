from typing import Dict, Any, Tuple, List

def apply_missing_policy(
    member_values: Dict[str, Any], 
    weights: Dict[str, float], 
    policy: str
) -> Tuple[Dict[str, float], Dict[str, float], List[str]]:
    """
    Applies the missing-data policy (redistribute, neutral, penalty)[cite: 5].
    Returns: (adjusted_values, adjusted_weights, missing_warnings)
    """
    adjusted_values = {}
    adjusted_weights = weights.copy()
    missing_warnings = []
    
    missing_criteria = [c for c, v in member_values.items() if v == "MISSING" or not isinstance(v, (int, float))]
    present_criteria = [c for c in weights.keys() if c not in missing_criteria]
    
    for c in missing_criteria:
        missing_warnings.append(f"Criterion '{c}' is missing.")
        
    if not missing_criteria:
        return member_values, adjusted_weights, missing_warnings

    if policy == "penalty":
        # Missing values score 0, weights stay the same[cite: 5].
        for c, v in member_values.items():
            adjusted_values[c] = 0.0 if c in missing_criteria else float(v)
            
    elif policy == "redistribute":
        # Distribute the weight of missing criteria to present ones[cite: 5].
        total_present_weight = sum(weights[c] for c in present_criteria)
        if total_present_weight == 0:
            for c in weights:
                adjusted_values[c] = 0.0
        else:
            scale_factor = 100.0 / total_present_weight
            for c in present_criteria:
                adjusted_weights[c] = weights[c] * scale_factor
            for c in missing_criteria:
                adjusted_weights[c] = 0.0
                adjusted_values[c] = 0.0
            for c in present_criteria:
                adjusted_values[c] = float(member_values[c])
                
    elif policy == "neutral":
        # Assign the average of present criteria to the missing ones[cite: 5].
        if not present_criteria:
            avg_score = 0.0
        else:
            avg_score = sum(float(member_values[c]) for c in present_criteria) / len(present_criteria)
            
        for c, v in member_values.items():
            adjusted_values[c] = avg_score if c in missing_criteria else float(v)

    return adjusted_values, adjusted_weights, missing_warnings