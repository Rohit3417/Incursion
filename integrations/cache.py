import os
import hashlib
import json
from typing import Optional

CACHE_DIR = os.path.join(os.path.dirname(__file__), "..", "cache")
os.makedirs(CACHE_DIR, exist_ok=True)

def get_cache_key(identifier: str) -> str:
    """Generate a SHA-256 hash for the cache filename[cite: 5]."""
    return hashlib.sha256(identifier.encode("utf-8")).hexdigest()

def read_from_cache(identifier: str) -> Optional[str]:
    key = get_cache_key(identifier)
    filepath = os.path.join(CACHE_DIR, f"{key}.txt")
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            return f.read()
    return None

def write_to_cache(identifier: str, content: str):
    key = get_cache_key(identifier)
    filepath = os.path.join(CACHE_DIR, f"{key}.txt")
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)