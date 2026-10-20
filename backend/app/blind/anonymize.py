import hashlib
import re
from copy import deepcopy
from typing import Dict, Any, List

def _blind_hash(val: str, prefix: str = "ID") -> str:
    digest = hashlib.sha256(str(val).encode("utf-8")).hexdigest()[:6].upper()
    return f"{prefix}-{digest}"

def anonymize_run_data(run_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Replaces identifying team names, member names, emails, colleges, and profile URLs
    with deterministic blind IDs when blind=true.
    """
    blinded = deepcopy(run_data)
    results: List[Dict[str, Any]] = blinded.get("results_json", [])

    for idx, team in enumerate(results):
        t_id = str(team.get("team_id", idx))
        team["team_name"] = f"Blind Team #{_blind_hash(t_id, 'TM')}"

        # Scrub any emails or URLs inside _member_criterion_values keys
        if "_member_criterion_values" in team and isinstance(team["_member_criterion_values"], dict):
            anon_members = {}
            for m_idx, (email_key, vals) in enumerate(team["_member_criterion_values"].items(), start=1):
                anon_members[f"Member-{_blind_hash(email_key, f'M{m_idx}')}"] = vals
            team["_member_criterion_values"] = anon_members

        # Redact any emails or URLs that might appear in warnings or explanation strings
        if "missing_warnings" in team and isinstance(team["missing_warnings"], list):
            team["missing_warnings"] = [
                re.sub(r'[\w\.-]+@[\w\.-]+', '[REDACTED_EMAIL]', w) for w in team["missing_warnings"]
            ]

    return blinded