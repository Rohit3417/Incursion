from datetime import datetime, timezone
from typing import List, Dict, Any
from backend.app.ingest.flags import StatusFlag

def analyze_github_repos(repos_data: List[Dict[str, Any]], profile_status: str = StatusFlag.OK) -> Dict[str, Any]:
    """
    Analyzes GitHub repos: original versus forked, languages, README present, 
    last push, stars, repo count[cite: 6]. Creates review flags that request review 
    without reducing the score[cite: 6].
    """
    if profile_status != StatusFlag.OK or not isinstance(repos_data, list):
        return {
            "status": profile_status,
            "repo_count": 0,
            "original_count": 0,
            "forked_count": 0,
            "languages": [],
            "total_stars": 0,
            "has_readme": False,
            "last_push": None,
            "review_flags": ["GITHUB_UNAVAILABLE"]
        }

    repo_count = len(repos_data)
    if repo_count == 0:
        return {
            "status": StatusFlag.OK,
            "repo_count": 0,
            "original_count": 0,
            "forked_count": 0,
            "languages": [],
            "total_stars": 0,
            "has_readme": False,
            "last_push": None,
            "review_flags": ["NO_REPOS"]
        }

    original_repos = [r for r in repos_data if not r.get("fork", False)]
    forked_repos = [r for r in repos_data if r.get("fork", False)]
    
    languages = list({r.get("language") for r in original_repos if r.get("language")})
    total_stars = sum(r.get("stargazers_count", 0) for r in original_repos)
    
    # Heuristic check for README / documentation presence
    has_readme = any(
        r.get("has_README", False) or bool(r.get("description")) or r.get("size", 0) > 10 
        for r in original_repos
    )

    push_dates = [r.get("pushed_at") for r in repos_data if r.get("pushed_at")]
    last_push = max(push_dates) if push_dates else None

    review_flags = []
    
    # Flag if mostly forks[cite: 6]
    if len(forked_repos) > len(original_repos):
        review_flags.append("MOSTLY_FORKS")

    # Flag if no recent activity within the last 180 days[cite: 6]
    if last_push:
        try:
            last_dt = datetime.fromisoformat(last_push.replace("Z", "+00:00"))
            days_inactive = (datetime.now(timezone.utc) - last_dt).days
            if days_inactive > 180:
                review_flags.append("NO_RECENT_ACTIVITY")
        except ValueError:
            pass
    else:
        review_flags.append("NO_RECENT_ACTIVITY")

    return {
        "status": StatusFlag.OK,
        "repo_count": repo_count,
        "original_count": len(original_repos),
        "forked_count": len(forked_repos),
        "languages": languages,
        "total_stars": total_stars,
        "has_readme": has_readme,
        "last_push": last_push,
        "review_flags": review_flags
    }