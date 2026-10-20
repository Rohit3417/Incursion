-- Insert a default Balanced preset configuration on database initialization
INSERT INTO configurations (name, is_preset, config_json)
VALUES (
    'Balanced Default',
    true,
    '{
        "criteria": [
            {"name": "Technical Skills", "weight": 20, "keywords": ["python", "react", "fastapi"]},
            {"name": "Projects and Experience", "weight": 25, "keywords": []},
            {"name": "GitHub Activity", "weight": 20, "keywords": []},
            {"name": "Achievements", "weight": 15, "keywords": []},
            {"name": "Portfolio", "weight": 20, "keywords": []}
        ],
        "eligibility_rules": [],
        "top_x": 10,
        "aggregation": "mean",
        "missing_policy": "redistribute",
        "tie_break": ["team_score", "team_id"]
    }'::jsonb
);