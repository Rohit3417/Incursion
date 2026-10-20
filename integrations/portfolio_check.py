import requests
from bs4 import BeautifulSoup
from typing import Dict, Any
from backend.app.ingest.flags import StatusFlag
from integrations.cache import read_from_cache, write_to_cache
import json

def check_portfolio_url(url: str) -> Dict[str, Any]:
    """
    Checks a portfolio website using Requests and BeautifulSoup: reachable, page title,
    and whether it contains content or project sections, with timeouts and disk caching[cite: 7].
    """
    if not url or url in [StatusFlag.MISSING, StatusFlag.INVALID]:
        return {
            "status": url if url == StatusFlag.INVALID else StatusFlag.MISSING,
            "reachable": False,
            "title": None,
            "has_projects_section": False
        }

    cache_key = f"portfolio_{url}"
    cached = read_from_cache(cache_key)
    if cached:
        try:
            return json.loads(cached)
        except Exception:
            pass

    target_url = url if "://" in url else f"https://{url}"
    try:
        res = requests.get(
            target_url, 
            timeout=8, 
            headers={"User-Agent": "IncursionRecruitmentBot/1.0"}
        )
        if res.status_code >= 400:
            result = {
                "status": StatusFlag.UNAVAILABLE,
                "reachable": False,
                "title": None,
                "has_projects_section": False
            }
            write_to_cache(cache_key, json.dumps(result))
            return result

        soup = BeautifulSoup(res.text, "html.parser")
        title = soup.title.string.strip() if soup.title and soup.title.string else "Untitled"
        
        body_text = soup.get_text(separator=" ").lower()
        project_indicators = ["project", "portfolio", "built", "github", "case study", "experience", "work"]
        has_projects = len(body_text.strip()) > 100 and any(kw in body_text for kw in project_indicators)

        result = {
            "status": StatusFlag.OK,
            "reachable": True,
            "title": title[:120],
            "has_projects_section": has_projects
        }
        write_to_cache(cache_key, json.dumps(result))
        return result

    except requests.exceptions.RequestException:
        return {
            "status": StatusFlag.UNAVAILABLE,
            "reachable": False,
            "title": None,
            "has_projects_section": False
        }