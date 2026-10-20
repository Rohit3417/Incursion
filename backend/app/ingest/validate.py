from backend.app.ingest.models import Team, LoadResult
from backend.app.ingest.flags import StatusFlag
from integrations.validators import is_valid_url, extract_github_username

def validate_dataset(load_result: LoadResult) -> dict:
    """
    Validates loaded teams, marks missing/invalid fields, and produces a report[cite: 4].
    Never leaves a blank or zero for links.
    """
    report = {
        "errors": [],
        "warnings": [],
        "duplicate_teams": [],
        "invalid_links_count": 0,
        "missing_links_count": 0
    }
    
    seen_team_names = set()
    seen_emails = set()
    seen_githubs = set()
    
    for idx, team in enumerate(load_result.teams):
        row_number = idx + 1
        
        # Check team duplicates
        if team.team_name.lower() in seen_team_names:
            report["duplicate_teams"].append({"row": row_number, "team": team.team_name})
        seen_team_names.add(team.team_name.lower())
        
        for member in team.members:
            # Email duplicates
            if member.email:
                if member.email.lower() in seen_emails:
                    report["warnings"].append(f"Row {row_number}: Duplicate email {member.email}")
                seen_emails.add(member.email.lower())
            
            # GitHub validation & extraction
            if not member.github or str(member.github).strip() == "":
                member.github = StatusFlag.MISSING
                report["missing_links_count"] += 1
            else:
                extracted = extract_github_username(member.github)
                if extracted:
                    member.github = extracted
                    if extracted.lower() in seen_githubs:
                        report["warnings"].append(f"Row {row_number}: Duplicate GitHub {extracted}")
                    seen_githubs.add(extracted.lower())
                else:
                    member.github = StatusFlag.INVALID
                    report["invalid_links_count"] += 1
            
            # General URL validation
            for link_field in ["resume", "linkedin", "portfolio"]:
                val = getattr(member, link_field)
                if not val or str(val).strip() == "":
                    setattr(member, link_field, StatusFlag.MISSING)
                    report["missing_links_count"] += 1
                elif not is_valid_url(str(val)):
                    setattr(member, link_field, StatusFlag.INVALID)
                    report["invalid_links_count"] += 1
                    
    return report