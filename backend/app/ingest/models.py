from pydantic import BaseModel, HttpUrl
from typing import List, Optional

class Member(BaseModel):
    name: str
    email: str
    github: Optional[str] = None
    resume: Optional[str] = None
    linkedin: Optional[str] = None
    portfolio: Optional[str] = None

class Team(BaseModel):
    team_id: str
    team_name: str
    members: List[Member]

class LoadResult(BaseModel):
    columns: List[str]
    row_count: int
    teams: List[Team]
    preview: List[dict]