import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

def get_db() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_KEY)

db = get_db()

# --- Datasets ---
# Replace save_dataset and save_run in backend/app/db/repository.py with:

def save_dataset(name: str, content_hash: str, teams_json: list, validation_report_json: dict) -> dict:
    existing = db.table("datasets").select("*").eq("content_hash", content_hash).execute()
    if existing.data:
        return existing.data[0]
    response = db.table("datasets").insert({
        "name": name,
        "content_hash": content_hash,
        "teams_json": teams_json,
        "validation_report_json": validation_report_json
    }).execute()
    return response.data[0]

# --- Runs ---

def save_run(dataset_id: str, config_snapshot_json: dict, run_hash: str, results_json: list) -> dict:
    existing = db.table("runs").select("*").eq("run_hash", run_hash).execute()
    if existing.data:
        return existing.data[0]
    response = db.table("runs").insert({
        "dataset_id": dataset_id,
        "config_snapshot_json": config_snapshot_json,
        "run_hash": run_hash,
        "results_json": results_json
    }).execute()
    return response.data[0]

def get_dataset(dataset_id: str) -> dict:
    response = db.table("datasets").select("*").eq("id", dataset_id).single().execute()
    return response.data

# --- Configurations ---
def save_config(name: str, config_json: dict, is_preset: bool = False) -> dict:
    response = db.table("configurations").insert({
        "name": name,
        "is_preset": is_preset,
        "config_json": config_json
    }).execute()
    return response.data[0]

def list_configs() -> list[dict]:
    response = db.table("configurations").select("*").execute()
    return response.data

def get_config(config_id: str) -> dict:
    response = db.table("configurations").select("*").eq("id", config_id).single().execute()
    return response.data

def get_run(run_id: str) -> dict:
    response = db.table("runs").select("*").eq("id", run_id).single().execute()
    return response.data

def list_runs() -> list[dict]:
    response = db.table("runs").select("id, dataset_id, run_hash, created_at").order('created_at', desc=True).execute()
    return response.data

# --- Overrides ---
def add_override(run_id: str, team_id: str, action: str, reason: str) -> dict:
    response = db.table("overrides").insert({
        "run_id": run_id,
        "team_id": team_id,
        "action": action,
        "reason": reason
    }).execute()
    return response.data[0]

def list_overrides(run_id: str) -> list[dict]:
    response = db.table("overrides").select("*").eq("run_id", run_id).execute()
    return response.data