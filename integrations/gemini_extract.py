import os
import json
import requests
from typing import Dict, Any
from backend.app.ingest.flags import StatusFlag
from integrations.cache import read_from_cache, write_to_cache

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

def extract_resume_with_gemini(resume_text: str) -> Dict[str, Any]:
    """
    Optional Gemini extraction (temperature 0, only resume text sent)[cite: 7].
    Requests skills, projects, and achievements each with an exact quote[cite: 7].
    Keeps a value as OK only if the exact quote exists in the resume text; otherwise marks UNCERTAIN.
    """
    if not resume_text or resume_text in [StatusFlag.MISSING, StatusFlag.INVALID, StatusFlag.UNAVAILABLE, "NO TEXT"]:
        return {"skills": [], "projects": [], "achievements": [], "status": StatusFlag.MISSING}

    cache_key = f"gemini_extract_{resume_text[:200]}_{len(resume_text)}"
    cached = read_from_cache(cache_key)
    if cached:
        try:
            return json.loads(cached)
        except Exception:
            pass

    if not GEMINI_API_KEY:
        return {"skills": [], "projects": [], "achievements": [], "status": StatusFlag.UNAVAILABLE}

    prompt = (
        "Extract technical skills, projects, and achievements from the resume text below. "
        "Return ONLY valid JSON with keys 'skills', 'projects', and 'achievements'. "
        "Each key must map to a list of objects containing 'value' (string) and 'quote' "
        "(an exact verbatim substring copied directly from the resume text).\n\n"
        f"RESUME TEXT:\n{resume_text}"
    )

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.0,
            "responseMimeType": "application/json"
        }
    }

    try:
        res = requests.post(url, json=payload, timeout=15)
        res.raise_for_status()
        resp_data = res.json()
        raw_json_text = resp_data["candidates"][0]["content"]["parts"][0]["text"]
        parsed = json.loads(raw_json_text)
    except Exception:
        return {"skills": [], "projects": [], "achievements": [], "status": StatusFlag.UNAVAILABLE}

    # Verify every extracted quote against the raw resume text[cite: 1, 7]
    norm_resume = " ".join(resume_text.split()).lower()
    verified_output = {"skills": [], "projects": [], "achievements": [], "status": StatusFlag.OK}

    for category in ["skills", "projects", "achievements"]:
        items = parsed.get(category, [])
        if not isinstance(items, list):
            continue
        for item in items:
            val = str(item.get("value", "")).strip()
            quote = str(item.get("quote", "")).strip()
            if not val:
                continue
            
            norm_quote = " ".join(quote.split()).lower()
            # Keep as OK only if the exact quote exists in the resume text, else mark UNCERTAIN[cite: 7]
            if norm_quote and norm_quote in norm_resume:
                item_status = StatusFlag.OK
                confidence = 0.95
            else:
                item_status = StatusFlag.UNCERTAIN
                confidence = 0.3

            verified_output[category].append({
                "value": val,
                "snippet": quote,
                "status": item_status,
                "source": "gemini_verified",
                "confidence": confidence
            })

    write_to_cache(cache_key, json.dumps(verified_output))
    return verified_output