from backend.app.scoring.config_schema import Configuration

def validate_config(config: Configuration) -> list[str]:
    """Validates the configuration and returns a list of error messages. Empty list means valid."""
    errors = []
    
    # 1. Weights must total exactly 100
    total_weight = sum(criterion.weight for criterion in config.criteria)
    if total_weight != 100:
        errors.append(f"Total weight must equal 100. Current total is {total_weight}.")
        
    # 2. Criteria must exist (at least one)
    if not config.criteria:
        errors.append("At least one criterion must be defined.")
        
    # 3. Valid rule operators are already handled by Pydantic Literal, 
    # but we can enforce logic checks here if needed.
    
    return errors