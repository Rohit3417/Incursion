import hashlib
import json
from typing import Any

def compute_run_hash(dataset_id: str, config_json: dict) -> str:
    """
    Computes a canonical SHA-256 hash from the dataset ID and config dictionary to guarantee reproducibility[cite: 5].
    """
    canonical_payload = {
        "dataset_id": dataset_id,
        "config": config_json
    }
    
    # sort_keys=True ensures identical dictionaries produce the same JSON string
    json_str = json.dumps(canonical_payload, sort_keys=True, separators=(',', ':'))
    return hashlib.sha256(json_str.encode('utf-8')).hexdigest()