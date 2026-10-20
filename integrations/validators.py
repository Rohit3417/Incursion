import re
from urllib.parse import urlparse

def is_valid_url(url: str) -> bool:
    if not url or not isinstance(url, str):
        return False
    # Basic URL structure check
    parsed = urlparse(url if "://" in url else f"https://{url}")
    return bool(parsed.netloc) and "." in parsed.netloc

def extract_github_username(github_input: str) -> str | None:
    if not github_input or not isinstance(github_input, str):
        return None
    
    github_input = github_input.strip().rstrip('/')
    
    # Extract from full repo or profile URL
    match = re.search(r'github\.com/([^/]+)', github_input, re.IGNORECASE)
    if match:
        return match.group(1)
        
    # If it's a plain string without spaces and no URL components, assume it's a username
    if " " not in github_input and "/" not in github_input and "." not in github_input:
        return github_input
        
    return None