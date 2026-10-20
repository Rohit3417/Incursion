import operator
from typing import List, Dict, Any, Tuple

# Mapping string operators from config to Python operator functions
OPERATORS = {
    ">": operator.gt,
    "<": operator.lt,
    ">=": operator.ge,
    "<=": operator.le,
    "==": operator.eq,
    "contains": lambda val, threshold: str(threshold).lower() in str(val).lower() if val else False
}

def evaluate_eligibility(team_data: Dict[str, Any], member_signals: List[Dict[str, Any]], rules: List[Dict[str, Any]]) -> Tuple[str, List[dict]]:
    """
    Evaluates boolean eligibility rules against a team and its members[cite: 5].
    Returns: (Status string, list of failed rules with details)
    Statuses: 'Eligible', 'Ineligible', 'Needs review'[cite: 5].
    """
    failed_rules = []
    needs_review = False

    for rule in rules:
        signal = rule["signal"]
        op_str = rule["operator"]
        threshold = rule["value"]
        scope = rule["scope"]
        op_func = OPERATORS[op_str]

        if scope == "team":
            # Team-level scope (e.g., team size)
            val = team_data.get(signal)
            if val is None:
                needs_review = True
                continue
            if not op_func(val, threshold):
                failed_rules.append({"rule": rule, "actual_value": val})

        elif scope == "any_member":
            # At least one member must pass the rule[cite: 5]
            passed = False
            missing_data = False
            for member in member_signals:
                val = member.get(signal)
                if val in ["MISSING", "INVALID", "UNAVAILABLE", "UNCERTAIN", None]:
                    missing_data = True
                    continue
                if op_func(val, threshold):
                    passed = True
                    break
            
            if not passed:
                if missing_data:
                    needs_review = True
                else:
                    failed_rules.append({"rule": rule, "actual_value": "No member met criteria"})

        elif scope == "all_members":
            # Every member must pass the rule[cite: 5]
            for member in member_signals:
                val = member.get(signal)
                if val in ["MISSING", "INVALID", "UNAVAILABLE", "UNCERTAIN", None]:
                    needs_review = True
                    continue
                if not op_func(val, threshold):
                    failed_rules.append({"rule": rule, "actual_value": val})

    if failed_rules:
        return "Ineligible", failed_rules
    if needs_review:
        return "Needs review", []
    
    return "Eligible", []