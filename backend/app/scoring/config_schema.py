from pydantic import BaseModel, Field
from typing import List, Optional, Literal

class Criterion(BaseModel):
    name: str
    weight: float
    keywords: List[str] = []

class EligibilityRule(BaseModel):
    signal: str
    operator: Literal[">", "<", ">=", "<=", "==", "contains"]
    value: str | int | float
    scope: Literal["any_member", "all_members", "team"]

class Configuration(BaseModel):
    criteria: List[Criterion]
    eligibility_rules: List[EligibilityRule] = []
    top_x: int = Field(default=10, ge=1)
    aggregation: Literal["mean", "highest_member", "weighted_mean"] = "mean"
    missing_policy: Literal["redistribute", "neutral", "penalty"] = "redistribute"
    tie_break: List[str] = ["team_score", "team_id"]