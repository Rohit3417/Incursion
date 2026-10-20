import csv
import random
import os
import time
from backend.app.ingest.loader import load_file
from backend.app.ingest.validate import validate_dataset
from backend.app.scoring.evaluator import evaluate

def generate_synthetic_data(num_teams: int, filename: str) -> str:
    filepath = os.path.join(os.path.dirname(__file__), "..", "samples", filename)
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    headers = [
        "team_id", "team_name",
        "member_1_name", "member_1_email", "member_1_github", "member_1_resume",
        "member_2_name", "member_2_email", "member_2_github", "member_2_resume",
        "member_3_name", "member_3_email", "member_3_github", "member_3_resume"
    ]
    
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        
        for i in range(1, num_teams + 1):
            team_size = random.choice([1, 2, 3])
            row = [f"T{i:04d}", f"SyntheticTeam_{i}"]
            
            for m in range(1, 4):
                if m <= team_size:
                    row.extend([
                        f"User_{i}_{m}",
                        f"user{i}_{m}@example.com",
                        f"https://github.com/user{i}_{m}" if random.random() > 0.1 else "",
                        f"https://drive.google.com/file/d/fake_{i}_{m}/view" if random.random() > 0.1 else ""
                    ])
                else:
                    row.extend(["", "", "", ""])
                    
            writer.writerow(row)
            
    return filepath

def benchmark_scale():
    config = {
        "criteria": [
            {"name": "Technical Skills", "weight": 20, "keywords": ["python", "react"]},
            {"name": "Projects and Experience", "weight": 25, "keywords": []},
            {"name": "GitHub Activity", "weight": 20, "keywords": []},
            {"name": "Achievements", "weight": 15, "keywords": []},
            {"name": "Portfolio", "weight": 20, "keywords": []}
        ],
        "eligibility_rules": [],
        "top_x": 25,
        "aggregation": "mean",
        "missing_policy": "redistribute",
        "tie_break": ["team_score", "team_id"]
    }

    for count in (100, 500, 1000):
        fname = f"synthetic_{count}.csv"
        path = generate_synthetic_data(count, fname)
        with open(path, "rb") as f:
            raw_bytes = f.read()

        t0 = time.perf_counter()
        loaded = load_file(raw_bytes, fname)
        t_load = time.perf_counter() - t0

        t1 = time.perf_counter()
        validate_dataset(loaded)
        t_val = time.perf_counter() - t1

        teams_dict = [t.dict() for t in loaded.teams]
        mock_member_vals = {
            m.email: {
                "Technical Skills": random.randint(20, 100),
                "Projects and Experience": random.randint(20, 100),
                "GitHub Activity": random.randint(0, 100),
                "Achievements": random.randint(0, 100),
                "Portfolio": random.choice([0, 100])
            }
            for t in loaded.teams for m in t.members
        }

        t2 = time.perf_counter()
        evaluate(teams_dict, mock_member_vals, config)
        t_eval = time.perf_counter() - t2

        print(f"[{count} Teams] Load: {t_load:.3f}s | Validate: {t_val:.3f}s | Evaluate: {t_eval:.3f}s")

if __name__ == "__main__":
    benchmark_scale()