import os
import json
import uuid
from typing import Dict, Any, Optional
from concurrent.futures import ThreadPoolExecutor

# Thread pool for background enrichment tasks[cite: 7]
EXECUTOR = ThreadPoolExecutor(max_workers=4)

# In-memory dictionary backed by a small local file in cache/ (no database table)[cite: 2, 7]
JOBS_MEMORY: Dict[str, Dict[str, Any]] = {}
JOBS_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "..", "cache", "enrichment_jobs.json")
os.makedirs(os.path.dirname(JOBS_FILE), exist_ok=True)

def _persist_jobs():
    try:
        with open(JOBS_FILE, "w", encoding="utf-8") as f:
            json.dump(JOBS_MEMORY, f, indent=2)
    except Exception:
        pass

def create_job(dataset_id: str, total_members: int) -> str:
    job_id = str(uuid.uuid4())
    JOBS_MEMORY[job_id] = {
        "job_id": job_id,
        "dataset_id": dataset_id,
        "status": "running",
        "total_members": total_members,
        "processed_members": 0,
        "errors": []
    }
    _persist_jobs()
    return job_id

def update_job_progress(job_id: str, processed_increment: int = 1, error: Optional[str] = None):
    if job_id in JOBS_MEMORY:
        JOBS_MEMORY[job_id]["processed_members"] += processed_increment
        if error:
            JOBS_MEMORY[job_id]["errors"].append(error)
        _persist_jobs()

def complete_job(job_id: str, status: str = "completed"):
    if job_id in JOBS_MEMORY:
        JOBS_MEMORY[job_id]["status"] = status
        _persist_jobs()

def get_job(job_id: str) -> Optional[Dict[str, Any]]:
    if job_id in JOBS_MEMORY:
        return JOBS_MEMORY[job_id]
    if os.path.exists(JOBS_FILE):
        try:
            with open(JOBS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data.get(job_id)
        except Exception:
            return None
    return None