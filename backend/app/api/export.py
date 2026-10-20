from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response
from typing import Literal
from backend.app.db.repository import get_run, get_dataset
from backend.app.api.overrides import get_final_order
from backend.app.core.exporter import filter_rows_by_export_type, build_csv_bytes, build_zip_bundle
from backend.app.blind.anonymize import anonymize_run_data
import json

router = APIRouter()

@router.get("/{run_id}/export")
def export_run_results(
    run_id: str,
    type: Literal["shortlist", "rejected", "waitlist", "breakdown"] = Query("shortlist"),
    format: Literal["csv", "json", "zip"] = Query("csv"),
    blind: bool = Query(False)
):
    """
    Exports run results with override columns in CSV, JSON, or reproducible ZIP bundle format.
    Supports blind=true to anonymize identifying fields.
    """
    run = get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    dataset = get_dataset(run["dataset_id"])
    final_order_resp = get_final_order(run_id)
    rows = final_order_resp["data"]

    if blind:
        blinded_wrapper = anonymize_run_data({"results_json": rows})
        rows = blinded_wrapper["results_json"]

    filtered_rows = filter_rows_by_export_type(rows, type)

    if format == "json":
        return Response(
            content=json.dumps(filtered_rows, indent=2),
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="run_{run_id[:8]}_{type}.json"'}
        )
    elif format == "zip":
        zip_bytes = build_zip_bundle(
            rows=filtered_rows,
            config_json=run.get("config_snapshot_json", {}),
            dataset_hash=dataset.get("content_hash", "") if dataset else "",
            run_hash=run.get("run_hash", "")
        )
        return Response(
            content=zip_bytes,
            media_type="application/zip",
            headers={"Content-Disposition": f'attachment; filename="run_{run_id[:8]}_{type}_bundle.zip"'}
        )
    else:
        csv_bytes = build_csv_bytes(filtered_rows)
        return Response(
            content=csv_bytes,
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="run_{run_id[:8]}_{type}.csv"'}
        )