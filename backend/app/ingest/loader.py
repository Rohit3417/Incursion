import pandas as pd
import json
from io import BytesIO
from backend.app.ingest.models import Team, Member, LoadResult

MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10MB limit

def load_file(file_bytes: bytes, filename: str) -> LoadResult:
    if len(file_bytes) > MAX_UPLOAD_BYTES:
        raise ValueError("File exceeds the 10MB size limit.")

    if filename.lower().endswith(".csv"):
        return _load_csv(file_bytes)
    elif filename.lower().endswith(".json"):
        return _load_json(file_bytes)
    else:
        raise ValueError("Unsupported file format. Please upload CSV or JSON.")

def _load_csv(file_bytes: bytes) -> LoadResult:
    df = None
    for encoding in ("utf-8-sig", "utf-8", "latin-1"):
        try:
            df = pd.read_csv(BytesIO(file_bytes), encoding=encoding)
            break
        except UnicodeDecodeError:
            continue

    if df is None:
        raise ValueError("Unable to decode CSV file. Please save as UTF-8.")

    if "team_id" not in df.columns or "team_name" not in df.columns:
        raise ValueError("Missing required columns: 'team_id' and 'team_name'.")

    columns = df.columns.tolist()
    teams = []

    for _, row in df.iterrows():
        if pd.isna(row.get("team_id")) and pd.isna(row.get("team_name")):
            continue  # Skip completely empty rows
        members = []
        for i in range(1, 9):
            prefix = f"member_{i}_"
            if f"{prefix}name" in row and pd.notna(row[f"{prefix}name"]) and str(row[f"{prefix}name"]).strip():
                members.append(Member(
                    name=str(row.get(f"{prefix}name", "")).strip(),
                    email=str(row.get(f"{prefix}email", "")).strip() if pd.notna(row.get(f"{prefix}email")) else "",
                    github=str(row.get(f"{prefix}github", "")).strip() if pd.notna(row.get(f"{prefix}github")) else None,
                    resume=str(row.get(f"{prefix}resume", "")).strip() if pd.notna(row.get(f"{prefix}resume")) else None,
                    linkedin=str(row.get(f"{prefix}linkedin", "")).strip() if pd.notna(row.get(f"{prefix}linkedin")) else None,
                    portfolio=str(row.get(f"{prefix}portfolio", "")).strip() if pd.notna(row.get(f"{prefix}portfolio")) else None,
                ))

        teams.append(Team(
            team_id=str(row["team_id"]).strip(),
            team_name=str(row["team_name"]).strip(),
            members=members
        ))

    return LoadResult(
        columns=columns,
        row_count=len(teams),
        teams=teams,
        preview=df.fillna("").head(20).to_dict(orient="records")
    )

def _load_json(file_bytes: bytes) -> LoadResult:
    text = file_bytes.decode("utf-8-sig", errors="replace")
    data = json.loads(text)
    if not isinstance(data, list):
        raise ValueError("JSON root must be an array of team objects.")
    teams = [Team(**team_data) for team_data in data]

    return LoadResult(
        columns=["team_id", "team_name", "members"],
        row_count=len(teams),
        teams=teams,
        preview=data[:20]
    )