from fastapi import APIRouter, HTTPException
from concurrent.futures import ThreadPoolExecutor, as_completed
from backend.app.db.repository import get_dataset, list_configs
from backend.app.core.jobs import EXECUTOR, create_job, update_job_progress, complete_job, get_job
from integrations.signals import build_member_signals

router = APIRouter()

def _run_enrichment_task(job_id: str, teams: list, keywords: list, use_gemini: bool):
    """
    Runs M2's resume, GitHub, portfolio, and signals modules across all members 
    using a thread pool and caches every output under cache/[cite: 7].
    """
    all_members = [m for t in teams for m in t.get("members", [])]
    
    with ThreadPoolExecutor(max_workers=5) as pool:
        future_to_email = {
            pool.submit(build_member_signals, member, keywords, use_gemini): member.get("email", "unknown")
            for member in all_members
        }
        for future in as_completed(future_to_email):
            email = future_to_email[future]
            try:
                future.result()
                update_job_progress(job_id, 1)
            except Exception as exc:
                update_job_progress(job_id, 1, error=f"{email}: {str(exc)}")

    complete_job(job_id, "completed")

@router.post("/")
def start_enrichment(dataset_id: str, use_gemini: bool = False):
    """
    Triggers background profile enrichment for a dataset and returns a job_id[cite: 7].
    """
    dataset = get_dataset(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    teams = dataset.get("teams_json", [])
    total_members = sum(len(t.get("members", [])) for t in teams)

    # Collect keywords across saved configurations so resume parsing matches organizer skills
    configs = list_configs()
    keywords = set()
    for c in configs:
        for crit in c.get("config_json", {}).get("criteria", []):
            keywords.update(crit.get("keywords", []))

    job_id = create_job(dataset_id, total_members)
    EXECUTOR.submit(_run_enrichment_task, job_id, teams, list(keywords), use_gemini)

    return {"status": "started", "job_id": job_id, "total_members": total_members}

@router.get("/{job_id}")
def check_enrichment_status(job_id: str):
    """
    Returns real-time progress of an enrichment job[cite: 7].
    """
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Enrichment job not found")
    return {"status": "success", "data": job}