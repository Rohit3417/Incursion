import os
import time
import json
import requests
from typing import Dict, Any
from backend.app.ingest.flags import StatusFlag
from integrations.cache import read_from_cache, write_to_cache

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

def _request_with_backoff(url: str, headers: dict, max_retries: int = 3) -> requests.Response | None:
    for attempt in range(max_retries):
        try:
            res = requests.get(url, headers=headers, timeout=8)
            # Stop immediately on rate limit (403/429) or 404
            if res.status_code in (403, 404, 429):
                return res
            if res.status_code < 500:
                return res
        except requests.exceptions.RequestException:
            pass
        time.sleep(0.5 * (2 ** attempt))
    return None

def fetch_github_profile(username: str) -> Dict[str, Any]:
    """
    Fetches public GitHub profile and repos with exponential backoff.
    On rate limit or timeout, stops safely, checks cache, or returns API_FAILED flag.
    """
    if not username or username in [StatusFlag.MISSING, StatusFlag.INVALID]:
        return {"status": username if username == StatusFlag.INVALID else StatusFlag.MISSING}

    cache_key = f"github_profile_{username.lower()}"
    cached = read_from_cache(cache_key)
    if cached:
        try:
            return json.loads(cached)
        except Exception:
            pass

    headers = {"Accept": "application/vnd.github.v3+json"}
    if GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"

    user_url = f"https://api.github.com/users/{username}"
    user_res = _request_with_backoff(user_url, headers)

    if user_res is None:
        return {"status": StatusFlag.API_FAILED, "error": "Network timeout"}
    if user_res.status_code == 404:
        res_obj = {"status": StatusFlag.INVALID, "error": "User not found"}
        write_to_cache(cache_key, json.dumps(res_obj))
        return res_obj
    if user_res.status_code in (403, 429) or user_res.headers.get("X-RateLimit-Remaining") == "0":
        return {"status": StatusFlag.API_FAILED, "error": "GitHub API rate limit exceeded"}
    if user_res.status_code >= 400:
        return {"status": StatusFlag.UNAVAILABLE, "error": f"HTTP {user_res.status_code}"}

    user_data = user_res.json()

    repos_url = f"https://api.github.com/users/{username}/repos?per_page=100&sort=pushed"
    repos_res = _request_with_backoff(repos_url, headers)
    repos_data = repos_res.json() if (repos_res and repos_res.status_code == 200 and isinstance(repos_res.json(), list)) else []

    original_repos = [r for r in repos_data if not r.get("fork", False)]
    total_stars = sum(r.get("stargazers_count", 0) for r in original_repos)
    languages = list({r.get("language") for r in original_repos if r.get("language")})

    payload = {
        "status": StatusFlag.OK,
        "username": username,
        "public_repos": user_data.get("public_repos", 0),
        "original_repos_count": len(original_repos),
        "total_stars": total_stars,
        "languages": languages,
        "approximate_commits_12m": len(original_repos) * 15
    }
    write_to_cache(cache_key, json.dumps(payload))
    return payload