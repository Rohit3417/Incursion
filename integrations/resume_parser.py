import re
from typing import List, Dict, Any

def parse_resume_text(text: str, keyword_list: List[str]) -> Dict[str, Any]:
    """
    Rule-based resume parser matching skills, projects, and achievements[cite: 6].
    Stores source snippet and offset for verifiability[cite: 6].
    """
    if not text or text == "NO TEXT":
        return {"skills": [], "projects": [], "achievements": [], "experience_years": 0}

    text_lower = text.lower()
    extracted_skills = []
    
    # 1. Skills extraction
    for kw in keyword_list:
        kw_lower = kw.lower()
        # Find all occurrences to get offsets
        for match in re.finditer(r'\b' + re.escape(kw_lower) + r'\b', text_lower):
            start_idx = match.start()
            snippet_start = max(0, start_idx - 30)
            snippet_end = min(len(text), start_idx + len(kw) + 30)
            
            extracted_skills.append({
                "value": kw,
                "offset": start_idx,
                "snippet": text[snippet_start:snippet_end].replace('\n', ' ').strip()
            })

    # 2. Projects block detection (heuristic)
    projects = []
    project_match = re.search(r'(?i)(projects|portfolio)\s*\n(.*?)(?=\n[A-Z][A-Z]|\Z)', text, re.DOTALL)
    if project_match:
        content = project_match.group(2).strip()
        if content:
            projects.append({
                "value": "Found Project Section",
                "offset": project_match.start(2),
                "snippet": content[:100] + "..." if len(content) > 100 else content
            })

    # 3. Achievements block detection (heuristic)
    achievements = []
    ach_match = re.search(r'(?i)(achievements|awards|honors)\s*\n(.*?)(?=\n[A-Z][A-Z]|\Z)', text, re.DOTALL)
    if ach_match:
        content = ach_match.group(2).strip()
        if content:
            achievements.append({
                "value": "Found Achievements Section",
                "offset": ach_match.start(2),
                "snippet": content[:100] + "..." if len(content) > 100 else content
            })

    return {
        "skills": extracted_skills,
        "projects": projects,
        "achievements": achievements,
        "experience_years": 0 # Placeholder for more complex regex
    }