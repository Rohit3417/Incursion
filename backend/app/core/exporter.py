import csv
import io
import json
import zipfile
import hashlib
from datetime import datetime, timezone
from typing import List, Dict, Any

def filter_rows_by_export_type(final_rows: List[Dict[str, Any]], export_type: str) -> List[Dict[str, Any]]:
    """
    Filters final override-aware rows based on type: shortlist, rejected, waitlist, breakdown.
    """
    if export_type == "shortlist":
        return [r for r in final_rows if str(r.get("status", "")).startswith("Shortlisted")]
    elif export_type == "waitlist":
        return [r for r in final_rows if r.get("status") == "Waitlisted"]
    elif export_type == "rejected":
        return [r for r in final_rows if r.get("status") in ["Not shortlisted", "Ineligible", "Excluded"]]
    # 'breakdown' or 'all' returns all teams with criterion details
    return final_rows


def build_csv_bytes(rows: List[Dict[str, Any]]) -> bytes:
    """
    Serializes export rows into CSV format including override audit columns and criterion breakdown.
    """
    output = io.StringIO()
    criteria_keys = []
    if rows:
        first_bd = rows[0].get("criterion_breakdown", {})
        criteria_keys = list(first_bd.keys())

    headers = [
        "final_rank", "automated_rank", "team_id", "team_name", 
        "team_score", "status", "override_action", "override_reason", "explanation"
    ] + [f"criterion_{k}" for k in criteria_keys]

    writer = csv.writer(output)
    writer.writerow(headers)

    for r in rows:
        bd = r.get("criterion_breakdown", {})
        row_vals = [
            r.get("final_rank") if r.get("final_rank") is not None else r.get("rank", ""),
            r.get("automated_rank") if r.get("automated_rank") is not None else r.get("rank", ""),
            r.get("team_id", ""),
            r.get("team_name", ""),
            r.get("team_score", 0.0),
            r.get("status", ""),
            r.get("override_action") or "",
            r.get("override_reason") or "",
            r.get("explanation", "")
        ] + [bd.get(k, 0.0) for k in criteria_keys]
        writer.writerow(row_vals)

    return output.getvalue().encode("utf-8")


def build_zip_bundle(
    rows: List[Dict[str, Any]],
    config_json: Dict[str, Any],
    dataset_hash: str,
    run_hash: str
) -> bytes:
    """
    Creates a ZIP archive containing results.csv, results.json, config.json, and manifest.json
    (dataset hash, config hash, run hash, timestamp).
    """
    config_str = json.dumps(config_json, sort_keys=True, indent=2)
    config_hash = hashlib.sha256(config_str.encode("utf-8")).hexdigest()

    manifest = {
        "dataset_hash": dataset_hash,
        "config_hash": config_hash,
        "run_hash": run_hash,
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "record_count": len(rows)
    }

    mem_zip = io.BytesIO()
    with zipfile.ZipFile(mem_zip, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("results.csv", build_csv_bytes(rows))
        zf.writestr("results.json", json.dumps(rows, indent=2))
        zf.writestr("config.json", config_str)
        zf.writestr("manifest.json", json.dumps(manifest, indent=2))

    mem_zip.seek(0)
    return mem_zip.read()