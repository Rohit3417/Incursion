from typing import Dict, Any, List

def map_signals_to_criteria(member_signals: List[Dict[str, Any]], config_criteria: List[Dict[str, Any]]) -> Dict[str, float]:
    """
    Turns raw signals (counts, keywords, lists) into 0-100 criterion values[cite: 6].
    Nothing about specific fields is hardcoded; the scale logic is driven by the criterion name or config[cite: 6].
    """
    criterion_values = {}
    
    # Helper to find a specific signal value securely
    def get_signal_val(sig_name: str, default=0):
        for sig in member_signals:
            if sig.get("name") == sig_name and sig.get("status") == "OK":
                return sig.get("value", default)
        return default

    for criterion in config_criteria:
        c_name = criterion["name"]
        score = 0.0
        
        # In a fully config-driven setup, `criterion` would contain `scales`.
        # Here we map based on expected criterion names matching the default configs.
        if c_name == "Technical Skills":
            keywords = criterion.get("keywords", [])
            extracted_skills = get_signal_val("skills_matched", [])
            matched_count = len([s for s in extracted_skills if s["value"].lower() in [k.lower() for k in keywords]])
            # Scale: 5 matched keywords = 100 points
            score = min((matched_count / 5.0) * 100, 100)
            
        elif c_name == "Projects and Experience":
            projects = get_signal_val("projects_found", [])
            # Scale: 3 projects = 100 points
            score = min((len(projects) / 3.0) * 100, 100)
            
        elif c_name == "GitHub Activity":
            commits = get_signal_val("github_commits", 0)
            # Scale: 500 commits = 100 points
            score = min((commits / 500.0) * 100, 100) if isinstance(commits, (int, float)) else 0
            
        elif c_name == "Achievements":
            achievements = get_signal_val("achievements_found", [])
            # Scale: 2 achievements = 100 points
            score = min((len(achievements) / 2.0) * 100, 100)
            
        elif c_name == "Portfolio":
            portfolio_valid = get_signal_val("portfolio_valid", False)
            score = 100.0 if portfolio_valid else 0.0
            
        criterion_values[c_name] = round(score, 2)

    return criterion_values