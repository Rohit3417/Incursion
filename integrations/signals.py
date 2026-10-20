from typing import Dict, Any, List
from integrations.resume_text import extract_text_from_pdf
from integrations.resume_parser import parse_resume_text
from integrations.github_client import fetch_github_profile
from integrations.portfolio_check import check_portfolio_url
from integrations.gemini_extract import extract_resume_with_gemini
from backend.app.ingest.flags import StatusFlag
from integrations.cache import write_to_cache, read_from_cache
import json

def build_member_signals(member: Dict[str, Any], config_keywords: List[str], use_gemini: bool = False) -> List[Dict[str, Any]]:
    """
    Combines resume parser output, GitHub profile, portfolio check, and validated links 
    into the per-member JSON defined in the profile contract[cite: 6, 7].
    """
    signals = []
    email = member.get("email", "unknown")
    cache_key = f"signals_{email}_{'gemini' if use_gemini else 'rule'}"
    
    cached = read_from_cache(cache_key)
    if cached:
        try:
            return json.loads(cached)
        except Exception:
            pass

    # 1. Resume Parsing (Rule-based default, optional Gemini verification)[cite: 7]
    resume_url = member.get("resume")
    if resume_url and resume_url not in [StatusFlag.MISSING, StatusFlag.INVALID]:
        text = extract_text_from_pdf(resume_url)
        if text and text not in [StatusFlag.MISSING, StatusFlag.INVALID, StatusFlag.UNAVAILABLE, "NO TEXT"]:
            parsed = parse_resume_text(text, config_keywords)
            
            if use_gemini:
                gemini_data = extract_resume_with_gemini(text)
                if gemini_data.get("status") == StatusFlag.OK:
                    parsed["skills"].extend(gemini_data.get("skills", []))
                    parsed["projects"].extend(gemini_data.get("projects", []))
                    parsed["achievements"].extend(gemini_data.get("achievements", []))

            # Verify snippet exists in resume text, otherwise mark UNCERTAIN[cite: 6, 7]
            def check_snippet_status(items):
                if not items:
                    return StatusFlag.UNCERTAIN
                for item in items:
                    snippet = item.get("snippet", "")
                    if snippet and snippet not in text:
                        return StatusFlag.UNCERTAIN
                return StatusFlag.OK

            signals.append({
                "name": "skills_matched",
                "value": parsed["skills"],
                "status": check_snippet_status(parsed["skills"]),
                "source": "resume_parser",
                "confidence": 0.9 if parsed["skills"] else 0.4
            })
            signals.append({
                "name": "projects_found",
                "value": parsed["projects"],
                "status": check_snippet_status(parsed["projects"]),
                "source": "resume_parser",
                "confidence": 0.8
            })
            signals.append({
                "name": "achievements_found",
                "value": parsed["achievements"],
                "status": check_snippet_status(parsed["achievements"]),
                "source": "resume_parser",
                "confidence": 0.8
            })
        else:
            signals.append({"name": "resume_data", "value": None, "status": text, "source": "resume_text", "confidence": 0.0})
    else:
        signals.append({"name": "resume_data", "value": None, "status": StatusFlag.MISSING, "source": "input", "confidence": 1.0})

    # 2. GitHub Signals
    github_user = member.get("github")
    gh_data = fetch_github_profile(github_user)
    signals.append({
        "name": "github_commits",
        "value": gh_data.get("approximate_commits_12m", 0),
        "status": gh_data.get("status", StatusFlag.MISSING),
        "source": "github_api",
        "confidence": 0.85 if gh_data.get("status") == StatusFlag.OK else 0.0
    })

    # 3. Portfolio Signals
    portfolio_url = member.get("portfolio")
    port_data = check_portfolio_url(portfolio_url)
    signals.append({
        "name": "portfolio_valid",
        "value": port_data.get("reachable", False) and port_data.get("has_projects_section", False),
        "status": port_data.get("status", StatusFlag.MISSING),
        "source": "portfolio_check",
        "confidence": 0.9 if port_data.get("status") == StatusFlag.OK else 0.0
    })

    write_to_cache(cache_key, json.dumps(signals))
    return signals