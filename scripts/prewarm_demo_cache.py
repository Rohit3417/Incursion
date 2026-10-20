import os
import shutil
from backend.app.ingest.loader import load_file
from integrations.signals import build_member_signals

def prewarm_demo_cache():
    sample_csv = os.path.join("samples", "registrations_40.csv")
    cache_dir = "cache"
    demo_cache_dir = os.path.join("samples", "demo_cache")
    os.makedirs(demo_cache_dir, exist_ok=True)

    with open(sample_csv, "rb") as f:
        loaded = load_file(f.read(), "registrations_40.csv")

    keywords = ["python", "react", "fastapi", "go", "postgresql", "docker"]
    for team in loaded.teams:
        for member in team.members:
            build_member_signals(member.dict(), keywords, use_gemini=False)

    # Copy cached signal files into samples/demo_cache/ for offline backup
    if os.path.exists(cache_dir):
        for fname in os.listdir(cache_dir):
            src = os.path.join(cache_dir, fname)
            if os.path.isfile(src):
                shutil.copy2(src, os.path.join(demo_cache_dir, fname))

    print(f"Pre-warmed offline demo cache in {demo_cache_dir}")

if __name__ == "__main__":
    prewarm_demo_cache()