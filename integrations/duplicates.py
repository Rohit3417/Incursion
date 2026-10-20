from typing import List, Dict, Any
from backend.app.ingest.flags import StatusFlag
from integrations.cache import get_cache_key

def detect_cross_team_duplicates(teams: List[Dict[str, Any]]) -> Dict[str, List[str]]:
    """
    Detects duplicate members across different teams (same GitHub, email, or resume hash)
    and returns a mapping of {team_id: [warning_flags]} for review.
    """
    email_to_teams: Dict[str, List[str]] = {}
    github_to_teams: Dict[str, List[str]] = {}
    resume_hash_to_teams: Dict[str, List[str]] = {}

    for team in teams:
        t_id = str(team.get("team_id"))
        for member in team.get("members", []):
            email = (member.get("email") or "").strip().lower()
            if email and email not in [StatusFlag.MISSING.lower(), StatusFlag.INVALID.lower()]:
                email_to_teams.setdefault(email, []).append(t_id)

            gh = (member.get("github") or "").strip().lower()
            if gh and gh not in [StatusFlag.MISSING.lower(), StatusFlag.INVALID.lower()]:
                github_to_teams.setdefault(gh, []).append(t_id)

            resume = (member.get("resume") or "").strip()
            if resume and resume not in [StatusFlag.MISSING, StatusFlag.INVALID]:
                r_hash = get_cache_key(resume)
                resume_hash_to_teams.setdefault(r_hash, []).append(t_id)

    team_flags: Dict[str, List[str]] = {}

    def record_conflicts(mapping: Dict[str, List[str]], label: str):
        for key, t_ids in mapping.items():
            unique_teams = sorted(set(t_ids))
            if len(unique_teams) > 1:
                for t_id in unique_teams:
                    others = [o for o in unique_teams if o != t_id]
                    msg = f"Cross-team duplicate {label} ({key}) shared with team(s): {', '.join(others)}"
                    team_flags.setdefault(t_id, []).append(msg)

    record_conflicts(email_to_teams, "email")
    record_conflicts(github_to_teams, "GitHub")
    record_conflicts(resume_hash_to_teams, "resume hash")

    return team_flags