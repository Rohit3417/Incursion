from fastapi import APIRouter, HTTPException
from backend.app.scoring.config_schema import Configuration
from backend.app.scoring.config_validate import validate_config
from backend.app.db.repository import save_config, list_configs, get_config

router = APIRouter()

@router.post("/")
def create_configuration(name: str, config: Configuration, is_preset: bool = False):
    """Validates and saves a new configuration[cite: 4]."""
    errors = validate_config(config)
    if errors:
        raise HTTPException(status_code=400, detail={"errors": errors})
        
    saved = save_config(name=name, config_json=config.dict(), is_preset=is_preset)
    return {"status": "success", "data": saved}

@router.get("/")
def get_all_configurations():
    """Lists all stored configurations[cite: 4]."""
    configs = list_configs()
    return {"status": "success", "data": configs}

@router.get("/{config_id}")
def get_single_configuration(config_id: str):
    """Retrieves a single configuration by ID[cite: 4]."""
    config = get_config(config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Configuration not found")
    return {"status": "success", "data": config}

@router.put("/{config_id}")
def update_configuration(config_id: str, name: str, config: Configuration):
    """Validates and updates an existing configuration[cite: 4]."""
    errors = validate_config(config)
    if errors:
        raise HTTPException(status_code=400, detail={"errors": errors})
    
    # In a minimal database, PUT can be implemented as overwriting the JSONB row
    # using the Supabase client directly, or handled by a repo function.
    from backend.app.db.repository import db
    response = db.table("configurations").update({
        "name": name,
        "config_json": config.dict()
    }).eq("id", config_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Configuration not found")
        
    return {"status": "success", "data": response.data[0]}