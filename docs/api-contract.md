# API Specification & Contract

This document provides the source-accurate HTTP API specification for the Incursion Track 3 Team Recruitment Automation Tool backend, based directly on the implementation in [`backend/app/main.py`](file:///backend/app/main.py) and the router modules under [`backend/app/api/`](file:///backend/app/api/).

Request and response structures are cross-referenced with the frontend consumer contracts in [`frontend/lib/api.ts`](file:///frontend/lib/api.ts) and [`frontend/lib/types.ts`](file:///frontend/lib/types.ts).

---

## 1. Global Overview

- **Base URL (Local Development)**: `http://localhost:8000`
- **API Prefix**: `/api` (except `/health` which is registered directly on the root application)
- **Interactive Documentation**:
  - Swagger UI: `http://localhost:8000/docs`
  - ReDoc: `http://localhost:8000/redoc`
- **Default Media Type**: `application/json` (unless exporting CSV or ZIP bundles)
- **CORS Policy**: Configured in `backend/app/main.py` with `allow_origins=["*"]`, `allow_credentials=True`, `allow_methods=["*"]`, `allow_headers=["*"]`.
- **Authentication**: **None implemented**. The API currently does not validate session tokens, Bearer headers, or API keys. All routes are accessible without credentials.

---

## 2. Endpoints by Subsystem

### 2.1 System Health

#### `GET /health`
Verifies backend liveness and database backend identifier.

- **Complete Path**: `/health`
- **Method**: `GET`
- **Request Parameters / Body**: None
- **Success Response (200 OK)**:
  ```json
  {
    "status": "healthy",
    "database": "supabase"
  }
  ```
- **Error Responses**: None (static response).

---

### 2.2 Upload & Dataset Retrieval

#### `POST /api/upload/`
Accepts a candidate registration CSV or JSON file, parses team and member rows, runs validation and duplicate checks, stores the dataset in PostgreSQL via Supabase, and returns an initial validation report and preview.

- **Complete Path**: `/api/upload/` (or `/api/upload`)
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Request Form Field**:
  - `file`: Binary file upload (`.csv` or `.json` only, max 10MB).
- **Processing Logic**:
  - CSV files must contain `team_id` and `team_name` headers, plus member columns for members 1 through 8 (e.g., `member_1_name`, `member_1_email`, `member_1_github`, `member_1_resume`, `member_1_linkedin`, `member_1_portfolio`).
  - JSON files must be a root JSON array of team objects (`[{"team_id": "...", "team_name": "...", "members": [...]}]`).
  - File content is hashed using SHA-256 (`content_hash`). If a dataset with the identical hash already exists in the database, the existing record is returned without creating a duplicate.
- **Success Response (200 OK)**:
  ```json
  {
    "dataset_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "row_count": 100,
    "preview": [
      {
        "team_id": "T0001",
        "team_name": "SyntheticTeam_1",
        "member_1_name": "User_1_1",
        "member_1_email": "user1_1@example.com",
        "member_1_github": "https://github.com/user1_1",
        "member_1_resume": "https://drive.google.com/file/d/fake_1_1/view"
      }
    ],
    "validation_report": {
      "errors": [],
      "warnings": [
        "Row 5: Duplicate email user1_1@example.com"
      ],
      "duplicate_teams": [
        {
          "row": 12,
          "team": "SyntheticTeam_1"
        }
      ],
      "invalid_links_count": 4,
      "missing_links_count": 18
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`:
    - Non-CSV/JSON file: `{"detail": "Only CSV and JSON files are supported.[cite: 5]"}`
    - Malformed file or missing required columns (`team_id`, `team_name`): `{"detail": "Malformed file: ..."}`
    - File exceeding 10MB: `{"detail": "Malformed file: File exceeds the 10MB size limit."}`
  - `500 Internal Server Error`:
    - Database insertion failure: `{"detail": "Database error: <message>"}`

#### `GET /api/upload/{dataset_id}/teams`
Retrieves raw ingested teams and members JSON stored for a specific dataset.

- **Complete Path**: `/api/upload/{dataset_id}/teams`
- **Method**: `GET`
- **Path Parameters**:
  - `dataset_id` (string/UUID, required): The unique identifier of the dataset.
- **Request Body**: None
- **Success Response (200 OK)**:
  ```json
  {
    "status": "success",
    "teams": [
      {
        "team_id": "T0001",
        "team_name": "SyntheticTeam_1",
        "members": [
          {
            "name": "User_1_1",
            "email": "user1_1@example.com",
            "github": "user1_1",
            "resume": "https://drive.google.com/file/d/fake_1_1/view",
            "linkedin": "MISSING",
            "portfolio": "MISSING"
          }
        ]
      }
    ]
  }
  ```
- **Error Responses**:
  - `404 Not Found`: `{"detail": "Dataset not found"}`

---

### 2.3 Configuration Management (Strategy Presets & Rules)

#### `POST /api/configs/`
Validates and persists a new scoring configuration strategy.

- **Complete Path**: `/api/configs/` (or `/api/configs`)
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Query Parameters**:
  - `name` (string, required): Display name of the strategy configuration.
  - `is_preset` (boolean, optional, default: `false`): Flags whether this configuration is a factory preset.
- **Request Body**:
  ```json
  {
    "criteria": [
      {
        "name": "Technical Skills",
        "weight": 20.0,
        "keywords": ["python", "react", "fastapi"]
      },
      {
        "name": "Projects and Experience",
        "weight": 25.0,
        "keywords": []
      },
      {
        "name": "GitHub Activity",
        "weight": 20.0,
        "keywords": []
      },
      {
        "name": "Achievements",
        "weight": 15.0,
        "keywords": []
      },
      {
        "name": "Portfolio",
        "weight": 20.0,
        "keywords": []
      }
    ],
    "eligibility_rules": [
      {
        "signal": "team_size",
        "operator": ">=",
        "value": 2,
        "scope": "team"
      }
    ],
    "top_x": 10,
    "aggregation": "mean",
    "missing_policy": "redistribute",
    "tie_break": ["team_score", "team_id"]
  }
  ```
- **Field Constraints**:
  - `criteria`: Array of objects (`name`: string, `weight`: float, `keywords`: list of strings). Criteria weight sum **must equal exactly 100.0**. At least one criterion must be specified.
  - `eligibility_rules`: Optional list. `operator` must be one of `">"`, `"<"`, `">="`, `"<="`, `"=="`, `"contains"`. `scope` must be one of `"any_member"`, `"all_members"`, `"team"`.
  - `top_x`: Integer >= 1 (default `10`).
  - `aggregation`: One of `"mean"`, `"highest_member"`, `"weighted_mean"` (default `"mean"`).
  - `missing_policy`: One of `"redistribute"`, `"neutral"`, `"penalty"` (default `"redistribute"`).
  - `tie_break`: List of field names (defaults to `["team_score", "team_id"]`).
- **Success Response (200 OK)**:
  ```json
  {
    "status": "success",
    "data": {
      "id": "3b290cb3-671e-45fa-bb23-9333be2d02c8",
      "name": "Balanced Default",
      "is_preset": false,
      "config_json": {
        "criteria": [ ... ],
        "eligibility_rules": [ ... ],
        "top_x": 10,
        "aggregation": "mean",
        "missing_policy": "redistribute",
        "tie_break": ["team_score", "team_id"]
      },
      "created_at": "2026-10-20T08:30:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Validation failure (e.g., weights sum to 95 instead of 100):
    ```json
    {
      "detail": {
        "errors": [
          "Total weight must equal 100. Current total is 95.0."
        ]
      }
    }
    ```
  - `422 Unprocessable Entity`: Missing `name` query parameter or invalid payload schema.

#### `GET /api/configs/`
Lists all stored configuration strategies and presets.

- **Complete Path**: `/api/configs/`
- **Method**: `GET`
- **Request Parameters / Body**: None
- **Success Response (200 OK)**:
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": "3b290cb3-671e-45fa-bb23-9333be2d02c8",
        "name": "Balanced Default",
        "is_preset": true,
        "config_json": { ... },
        "created_at": "2026-10-20T08:00:00.000Z"
      }
    ]
  }
  ```

#### `GET /api/configs/{config_id}`
Retrieves a single configuration by its UUID.

- **Complete Path**: `/api/configs/{config_id}`
- **Method**: `GET`
- **Path Parameters**:
  - `config_id` (string/UUID, required)
- **Success Response (200 OK)**:
  ```json
  {
    "status": "success",
    "data": {
      "id": "3b290cb3-671e-45fa-bb23-9333be2d02c8",
      "name": "Balanced Default",
      "is_preset": true,
      "config_json": { ... },
      "created_at": "2026-10-20T08:00:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - `404 Not Found`: `{"detail": "Configuration not found"}`

#### `PUT /api/configs/{config_id}`
Validates and overwrites an existing configuration record.

- **Complete Path**: `/api/configs/{config_id}`
- **Method**: `PUT`
- **Path Parameters**:
  - `config_id` (string/UUID, required)
- **Query Parameters**:
  - `name` (string, required): Updated name for the configuration.
- **Request Body**: `application/json` (Configuration schema matching `POST /api/configs/`)
- **Success Response (200 OK)**:
  ```json
  {
    "status": "success",
    "data": {
      "id": "3b290cb3-671e-45fa-bb23-9333be2d02c8",
      "name": "Balanced Default (Updated)",
      "is_preset": false,
      "config_json": { ... },
      "created_at": "2026-10-20T08:00:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Invalid weights or empty criteria.
  - `404 Not Found`: `{"detail": "Configuration not found"}`

---

### 2.4 Evaluation Runs & History

#### `POST /api/runs/`
Executes the evaluation pipeline against a saved dataset and configuration, calculates team scores and rankings, computes the deterministic SHA-256 `run_hash`, and saves the run to the database.

- **Complete Path**: `/api/runs/`
- **Method**: `POST`
- **Query Parameters**:
  - `dataset_id` (string/UUID, required): The dataset to evaluate.
  - `config_id` (string/UUID, required): The configuration strategy to apply.
- **Request Body**: None
- **Processing Logic**:
  - Loads dataset teams and configuration snapshot.
  - Computes `run_hash = SHA256(canonical_json({"dataset_id": dataset_id, "config": config_json}))`.
  - Runs signal generation, criterion mapping, member scoring, missing-data adjustments, aggregation, eligibility checks, deterministic ranking, cross-team duplicate detection, and explanation generation.
  - If a run with the identical `run_hash` already exists in `runs`, the existing run record is returned idempotently.
- **Success Response (200 OK)**:
  ```json
  {
    "status": "success",
    "run_id": "4fa6b218-e39d-476a-b283-ce83f8115682"
  }
  ```
- **Error Responses**:
  - `404 Not Found`: `{"detail": "Dataset not found"}` or `{"detail": "Configuration not found"}`
  - `422 Unprocessable Entity`: Missing `dataset_id` or `config_id` query parameters.

#### `GET /api/runs/`
Lists all historical evaluation runs, ordered newest first.

- **Complete Path**: `/api/runs/`
- **Method**: `GET`
- **Request Parameters / Body**: None
- **Success Response (200 OK)**:
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": "4fa6b218-e39d-476a-b283-ce83f8115682",
        "dataset_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        "run_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "created_at": "2026-10-20T08:45:00.000Z"
      }
    ]
  }
  ```

#### `GET /api/runs/{run_id}`
Retrieves full details of an evaluation run including stored configuration snapshot and evaluated team results.

- **Complete Path**: `/api/runs/{run_id}`
- **Method**: `GET`
- **Path Parameters**:
  - `run_id` (string/UUID, required)
- **Success Response (200 OK)**:
  ```json
  {
    "status": "success",
    "data": {
      "id": "4fa6b218-e39d-476a-b283-ce83f8115682",
      "dataset_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "config_snapshot_json": {
        "criteria": [ ... ],
        "top_x": 10,
        "aggregation": "mean",
        "missing_policy": "redistribute",
        "tie_break": ["team_score", "team_id"]
      },
      "run_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "results_json": [
        {
          "team_id": "T0001",
          "team_name": "SyntheticTeam_1",
          "rank": 1,
          "team_score": 84.5,
          "status": "Shortlisted",
          "criterion_breakdown": {
            "Technical Skills": 18.0,
            "Projects and Experience": 22.5,
            "GitHub Activity": 16.0,
            "Achievements": 12.0,
            "Portfolio": 16.0
          },
          "failed_rules": [],
          "missing_warnings": [],
          "explanation": "Shortlisted (Rank #1) because of strong Projects and Experience and Technical Skills (+14.5 pts above the Top-10 cutoff).",
          "explanation_details": {
            "criterion_shares": {
              "Technical Skills": 21.3,
              "Projects and Experience": 26.6,
              "GitHub Activity": 18.9,
              "Achievements": 14.2,
              "Portfolio": 18.9
            },
            "top_two_strengths": ["Projects and Experience", "Technical Skills"],
            "weakest_criterion": "Achievements",
            "gap_to_cutoff": 14.5,
            "failed_eligibility_rules": [],
            "missing_warnings": []
          },
          "_member_criterion_values": {
            "user1_1@example.com": {
              "Technical Skills": 90.0,
              "Projects and Experience": 90.0,
              "GitHub Activity": 80.0,
              "Achievements": 80.0,
              "Portfolio": 80.0
            }
          }
        }
      ],
      "created_at": "2026-10-20T08:45:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - `404 Not Found`: `{"detail": "Run not found"}`

---

### 2.5 Overrides & Final Ordering

#### `POST /api/runs/{run_id}/overrides`
Records a manual reviewer override (`pin`, `exclude`, or `waitlist`) with a mandatory audit reason. The underlying automated run output in `runs` is never modified.

- **Complete Path**: `/api/runs/{run_id}/overrides`
- **Method**: `POST`
- **Path Parameters**:
  - `run_id` (string/UUID, required)
- **Content-Type**: `application/json`
- **Request Body**:
  ```json
  {
    "team_id": "T0042",
    "action": "pin",
    "reason": "Outstanding open-source contribution acknowledged by jury."
  }
  ```
- **Validation Constraints**:
  - `action`: Must be exactly `"pin"`, `"exclude"`, or `"waitlist"`.
  - `reason`: String (required).
- **Success Response (200 OK)**:
  ```json
  {
    "status": "success",
    "data": {
      "id": "18f9da94-527e-407b-83c3-6363673ddfa5",
      "run_id": "4fa6b218-e39d-476a-b283-ce83f8115682",
      "team_id": "T0042",
      "action": "pin",
      "reason": "Outstanding open-source contribution acknowledged by jury.",
      "created_at": "2026-10-20T08:50:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - `404 Not Found`: `{"detail": "Run not found"}`
  - `422 Unprocessable Entity`: Invalid action literal or missing fields.

#### `GET /api/runs/{run_id}/overrides`
Lists all manual overrides registered for a specific evaluation run.

- **Complete Path**: `/api/runs/{run_id}/overrides`
- **Method**: `GET`
- **Path Parameters**:
  - `run_id` (string/UUID, required)
- **Success Response (200 OK)**:
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": "18f9da94-527e-407b-83c3-6363673ddfa5",
        "run_id": "4fa6b218-e39d-476a-b283-ce83f8115682",
        "team_id": "T0042",
        "action": "pin",
        "reason": "Outstanding open-source contribution acknowledged by jury.",
        "created_at": "2026-10-20T08:50:00.000Z"
      }
    ]
  }
  ```

#### `GET /api/runs/{run_id}/final`
Computes the final team ordering with manual overrides applied. Preserves `automated_rank` beside `final_rank`. Active ordering prioritizes:
1. Pinned teams (ranked 1 .. P)
2. Regular eligible teams (ranked P+1 .. N)
3. Waitlisted teams
4. Excluded and unoverridden Ineligible teams (`final_rank` = `null`)

- **Complete Path**: `/api/runs/{run_id}/final`
- **Method**: `GET`
- **Path Parameters**:
  - `run_id` (string/UUID, required)
- **Success Response (200 OK)**:
  ```json
  {
    "status": "success",
    "run_id": "4fa6b218-e39d-476a-b283-ce83f8115682",
    "data": [
      {
        "team_id": "T0042",
        "team_name": "SyntheticTeam_42",
        "rank": 14,
        "automated_rank": 14,
        "final_rank": 1,
        "team_score": 68.2,
        "status": "Shortlisted (Pinned)",
        "automated_status": "Not shortlisted",
        "override_action": "pin",
        "override_reason": "Outstanding open-source contribution acknowledged by jury.",
        "criterion_breakdown": { ... },
        "explanation": "..."
      },
      {
        "team_id": "T0001",
        "team_name": "SyntheticTeam_1",
        "rank": 1,
        "automated_rank": 1,
        "final_rank": 2,
        "team_score": 84.5,
        "status": "Shortlisted",
        "automated_status": "Shortlisted",
        "override_action": null,
        "override_reason": null,
        "criterion_breakdown": { ... },
        "explanation": "..."
      }
    ]
  }
  ```
- **Error Responses**:
  - `404 Not Found`: `{"detail": "Run not found"}`

---

### 2.6 Live Re-Ranking & What-If Analysis

#### `POST /api/rank/`
Recomputes scores and ranks in memory from cached member criterion values without modifying the stored database run. Returns rank deltas (`old_rank`, `new_rank`, `rank_delta`) and flags teams that entered or left the `top_x` cutoff. Optionally performs a +/- 5% sensitivity analysis.

- **Complete Path**: `/api/rank/` (or `/api/rank`)
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Request Body**:
  ```json
  {
    "run_id": "4fa6b218-e39d-476a-b283-ce83f8115682",
    "config": {
      "criteria": [
        {"name": "Technical Skills", "weight": 10.0, "keywords": ["python", "react"]},
        {"name": "Projects and Experience", "weight": 40.0, "keywords": []},
        {"name": "GitHub Activity", "weight": 30.0, "keywords": []},
        {"name": "Achievements", "weight": 10.0, "keywords": []},
        {"name": "Portfolio", "weight": 10.0, "keywords": []}
      ],
      "eligibility_rules": [],
      "top_x": 10,
      "aggregation": "mean",
      "missing_policy": "redistribute",
      "tie_break": ["team_score", "team_id"]
    },
    "include_sensitivity": true
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "status": "success",
    "data": [
      {
        "team_id": "T0007",
        "team_name": "SyntheticTeam_7",
        "rank": 8,
        "old_rank": 14,
        "new_rank": 8,
        "rank_delta": 6,
        "entered_top_x": true,
        "left_top_x": false,
        "team_score": 79.4,
        "status": "Shortlisted",
        "criterion_breakdown": { ... }
      }
    ],
    "sensitivity": [
      {
        "criterion": "Projects and Experience",
        "weight_shift": "+5",
        "affected_teams": [
          {
            "team_id": "T0012",
            "team_name": "SyntheticTeam_12",
            "old_status": "Not shortlisted",
            "new_status": "Shortlisted"
          }
        ]
      }
    ]
  }
  ```
- **Error Responses**:
  - `404 Not Found`: `{"detail": "Run not found"}` or `{"detail": "Dataset not found"}`
  - `422 Unprocessable Entity`: Malformed JSON or missing `run_id`/`config`.

---

### 2.7 Profile Enrichment Background Jobs

#### `POST /api/enrich/`
Triggers an asynchronous background task to fetch GitHub profiles, parse resume PDFs, verify portfolio URLs, and optionally invoke Gemini 2.5 Flash across all candidates in a dataset.

- **Complete Path**: `/api/enrich/` (or `/api/enrich`)
- **Method**: `POST`
- **Query Parameters**:
  - `dataset_id` (string/UUID, required): Target dataset ID.
  - `use_gemini` (boolean, optional, default: `false`): Enables Gemini API claims extraction.
- **Request Body**: None
- **Processing Logic**:
  - Collects all keywords defined across stored configurations to drive resume skill detection.
  - Generates a UUID `job_id` and registers the job in `JOBS_MEMORY` and `cache/enrichment_jobs.json`.
  - Dispatches parallel workers via `ThreadPoolExecutor(max_workers=5)` to populate `cache/`.
- **Success Response (200 OK)**:
  ```json
  {
    "status": "started",
    "job_id": "92da1577-bc68-45fe-b481-2856db326e10",
    "total_members": 240
  }
  ```
- **Error Responses**:
  - `404 Not Found`: `{"detail": "Dataset not found"}`
  - `422 Unprocessable Entity`: Missing `dataset_id`.

#### `GET /api/enrich/{job_id}`
Returns the real-time execution progress of an enrichment background job.

- **Complete Path**: `/api/enrich/{job_id}`
- **Method**: `GET`
- **Path Parameters**:
  - `job_id` (string/UUID, required)
- **Success Response (200 OK)**:
  ```json
  {
    "status": "success",
    "data": {
      "job_id": "92da1577-bc68-45fe-b481-2856db326e10",
      "dataset_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "status": "running",
      "total_members": 240,
      "processed_members": 150,
      "errors": []
    }
  }
  ```
  *(Status transitions to `"completed"` once all members finish).*
- **Error Responses**:
  - `404 Not Found`: `{"detail": "Enrichment job not found"}`

---

### 2.8 Strategy Comparison

#### `POST /api/compare/`
Compares results of two configurations on the same dataset, outputting a rank-difference table, and optionally computing pairwise criterion differences between two specific teams.

- **Complete Path**: `/api/compare/` (or `/api/compare`)
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Request Body**:
  ```json
  {
    "run_id": "4fa6b218-e39d-476a-b283-ce83f8115682",
    "config_a": {
      "criteria": [
        {"name": "Technical Skills", "weight": 50.0, "keywords": ["python", "react"]},
        {"name": "Projects and Experience", "weight": 20.0, "keywords": []},
        {"name": "GitHub Activity", "weight": 10.0, "keywords": []},
        {"name": "Achievements", "weight": 10.0, "keywords": []},
        {"name": "Portfolio", "weight": 10.0, "keywords": []}
      ],
      "top_x": 10,
      "aggregation": "mean",
      "missing_policy": "redistribute",
      "tie_break": ["team_score", "team_id"]
    },
    "config_b": {
      "criteria": [
        {"name": "Technical Skills", "weight": 10.0, "keywords": ["python", "react"]},
        {"name": "Projects and Experience", "weight": 40.0, "keywords": []},
        {"name": "GitHub Activity", "weight": 30.0, "keywords": []},
        {"name": "Achievements", "weight": 10.0, "keywords": []},
        {"name": "Portfolio", "weight": 10.0, "keywords": []}
      ],
      "top_x": 10,
      "aggregation": "mean",
      "missing_policy": "redistribute",
      "tie_break": ["team_score", "team_id"]
    },
    "team_a_id": "T0001",
    "team_b_id": "T0002"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "status": "success",
    "run_id": "4fa6b218-e39d-476a-b283-ce83f8115682",
    "comparison": [
      {
        "team_id": "T0001",
        "team_name": "SyntheticTeam_1",
        "rank_a": 2,
        "score_a": 88.0,
        "status_a": "Shortlisted",
        "rank_b": 9,
        "score_b": 72.5,
        "status_b": "Shortlisted",
        "rank_diff": -7,
        "score_diff": -15.5,
        "status_changed": false
      }
    ],
    "pairwise": {
      "team_a": {
        "team_id": "T0001",
        "team_name": "SyntheticTeam_1",
        "score": 84.5
      },
      "team_b": {
        "team_id": "T0002",
        "team_name": "SyntheticTeam_2",
        "score": 81.0
      },
      "score_diff": 3.5,
      "criteria_comparison": [
        {
          "criterion": "Technical Skills",
          "team_a_points": 18.0,
          "team_b_points": 14.0,
          "difference": 4.0
        }
      ]
    }
  }
  ```
- **Error Responses**:
  - `404 Not Found`: `{"detail": "Run not found"}` or `{"detail": "Dataset not found"}`
  - `422 Unprocessable Entity`: Malformed request body.

---

### 2.9 Exporting Results

#### `GET /api/runs/{run_id}/export`
Generates downloadable files of final run results (including override columns and explanations) in CSV, JSON, or a reproducible ZIP archive.

- **Complete Path**: `/api/runs/{run_id}/export`
- **Method**: `GET`
- **Path Parameters**:
  - `run_id` (string/UUID, required)
- **Query Parameters**:
  - `type` (string, optional, default: `"shortlist"`): Filter mode. Allowed values:
    - `"shortlist"`: Only teams with status starting with `"Shortlisted"`.
    - `"rejected"`: Only teams with status in `["Not shortlisted", "Ineligible", "Excluded"]`.
    - `"waitlist"`: Only teams with status `"Waitlisted"`.
    - `"breakdown"`: All teams including criterion score columns.
  - `format` (string, optional, default: `"csv"`): Allowed values: `"csv"`, `"json"`, `"zip"`.
  - `blind` (boolean, optional, default: `false`): When `true`, team names are replaced with deterministic hashes (`Blind Team #TM-XXXXXX`), member references are masked, and email addresses in warnings/explanations are scrubbed to `[REDACTED_EMAIL]`.
- **Response Headers & Formats**:
  - `format=csv`:
    - Content-Type: `text/csv`
    - Content-Disposition: `attachment; filename="run_<id>_<type>.csv"`
    - Columns: `final_rank`, `automated_rank`, `team_id`, `team_name`, `team_score`, `status`, `override_action`, `override_reason`, `explanation`, `criterion_<name>...`
  - `format=json`:
    - Content-Type: `application/json`
    - Content-Disposition: `attachment; filename="run_<id>_<type>.json"`
  - `format=zip`:
    - Content-Type: `application/zip`
    - Content-Disposition: `attachment; filename="run_<id>_<type>_bundle.zip"`
    - Contained files:
      1. `results.csv`: Table with override audit columns and criterion breakdown.
      2. `results.json`: Complete evaluated rows.
      3. `config.json`: Canonical snapshot of the scoring configuration.
      4. `manifest.json`: Verification manifest containing `dataset_hash`, `config_hash`, `run_hash`, `exported_at`, and `record_count`.
- **Error Responses**:
  - `404 Not Found`: `{"detail": "Run not found"}`
  - `422 Unprocessable Entity`: Invalid `type` or `format` query values.

---

### 2.10 Cryptographic Reproducibility Verification

#### `POST /api/runs/{run_id}/verify`
Re-runs the evaluation pipeline against the stored dataset and configuration snapshot, recomputing both the `run_hash` and canonical JSON output hash to guarantee 100% deterministic reproducibility.

- **Complete Path**: `/api/runs/{run_id}/verify`
- **Method**: `POST`
- **Path Parameters**:
  - `run_id` (string/UUID, required)
- **Request Body**: None
- **Success Response (200 OK)**:
  ```json
  {
    "status": "success",
    "run_id": "4fa6b218-e39d-476a-b283-ce83f8115682",
    "matches": true,
    "stored_run_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "recomputed_run_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "stored_output_hash": "4a7178c7c7fdc05763cb3659223dbba8d23d8cba172b84a921d7265882e34273",
    "recomputed_output_hash": "4a7178c7c7fdc05763cb3659223dbba8d23d8cba172b84a921d7265882e34273"
  }
  ```
- **Error Responses**:
  - `404 Not Found`: `{"detail": "Run not found"}` or `{"detail": "Dataset not found"}`

---

## 3. Implementation Notes / Known Gaps

This section explicitly documents discrepancies between the current backend codebase and the frontend consumer in [`frontend/lib/api.ts`](file:///frontend/lib/api.ts), as well as architectural notes:

1. **Missing Authentication & Security**:
   - Authentication is **not implemented**. Neither JWT validation nor session checks exist in [`backend/app/main.py`](file:///backend/app/main.py).
   - In [`backend/app/db/repository.py`](file:///backend/app/db/repository.py), queries execute with direct client access, and database tables in [`temp_supabase/schema.sql`](file:///temp_supabase/schema.sql) disable Row Level Security (`DISABLE ROW LEVEL SECURITY`). The API is designed for trusted local/demo use and must not be exposed to the public internet without an auth gateway or reverse-proxy authentication.

2. **Parameter Conventions**:
   - `POST /api/runs/`: Takes `dataset_id` and `config_id` as **query parameters** (`?dataset_id=...&config_id=...`), not in the JSON request body.
   - `POST /api/configs/`: Takes `name` and `is_preset` as query parameters, and the `Configuration` object as the request body.
   - `PUT /api/configs/{config_id}`: Takes `name` as a query parameter and the `Configuration` object as the request body.
   - `POST /api/enrich/`: Takes `dataset_id` and `use_gemini` as query parameters with an empty body.

3. **Frontend API Client Surface Coverage (`frontend/lib/api.ts`)**:
   - The enrichment routes `POST /api/enrich/` and `GET /api/enrich/{job_id}` are fully functional in the backend (`backend/app/api/enrich.py`), but [`frontend/lib/api.ts`](file:///frontend/lib/api.ts) contains no client wrappers for them.
   - `GET /api/upload/{dataset_id}/teams` is implemented in backend, but frontend pages retrieve teams indirectly via run results or the upload response.
   - `GET /api/configs/{config_id}` and `PUT /api/configs/{config_id}` are implemented in backend, but frontend only consumes `getConfigs()` (GET all) and `saveConfig()` (POST).
   - `GET /api/runs/{run_id}/overrides` is implemented in backend, but the frontend consumes `getFinalRunOrder()` (`GET /api/runs/{run_id}/final`) which merges overrides directly into the results array.

4. **Background Job Persistence**:
   - Background enrichment jobs in [`backend/app/core/jobs.py`](file:///backend/app/core/jobs.py) are stored in an in-memory dictionary `JOBS_MEMORY` backed by a local JSON file `cache/enrichment_jobs.json`. There is no dedicated Supabase table for background jobs, meaning job status is node-local.

5. **Default Pipeline Execution & Gemini**:
   - In [`backend/app/core/pipeline.py`](file:///backend/app/core/pipeline.py), `build_member_signals(member, all_keywords)` is called without passing `use_gemini=True`. Consequently, the standard synchronous run creation (`POST /api/runs/`) always uses rule-based parsing. Gemini extraction is only performed when the background enrichment endpoint (`POST /api/enrich/?use_gemini=true`) is called explicitly.

6. **Eligibility Rules Scope Gap**:
   - In [`backend/app/scoring/evaluator.py:L38`](file:///backend/app/scoring/evaluator.py#L38), `evaluate_eligibility(team, [], rules)` is called with an empty list `[]` for `member_signals`. Therefore, eligibility rules configured with `scope="any_member"` or `scope="all_members"` cannot inspect member signals and will flag teams as failed or needing review. Only `scope="team"` rules (such as team-level properties) evaluate against actual values in the current evaluator loop.

---

## 4. Cross-Reference Index

| Feature Area | Backend Route | HTTP Method | Frontend Wrapper (`frontend/lib/api.ts`) | Related Documentation |
| :--- | :--- | :--- | :--- | :--- |
| **Health** | `/health` | `GET` | *(None)* | [README.MD](file:///README.MD) |
| **Upload** | `/api/upload/` | `POST` | `uploadDataset(file)` | [Data Sources](file:///docs/data-sources.md) |
| **Dataset Teams** | `/api/upload/{dataset_id}/teams` | `GET` | *(None)* | [Profile Contract](file:///docs/profile-contract.md) |
| **Create Config** | `/api/configs/` | `POST` | `saveConfig(name, config, isPreset)` | [Scoring Explained](file:///docs/scoring-explained.md) |
| **List Configs** | `/api/configs/` | `GET` | `getConfigs()` | [Scoring Explained](file:///docs/scoring-explained.md) |
| **Get Config** | `/api/configs/{config_id}` | `GET` | *(None)* | [Scoring Explained](file:///docs/scoring-explained.md) |
| **Update Config** | `/api/configs/{config_id}` | `PUT` | *(None)* | [Scoring Explained](file:///docs/scoring-explained.md) |
| **Execute Run** | `/api/runs/` | `POST` | `runEvaluation(datasetId, configId)` | [Scoring Explained](file:///docs/scoring-explained.md) |
| **List Runs** | `/api/runs/` | `GET` | `listRuns()` | [Demo Script](file:///docs/demo-script.md) |
| **Get Run** | `/api/runs/{run_id}` | `GET` | `getRun(runId)` | [Demo Scenario](file:///docs/demo-scenario.md) |
| **Add Override** | `/api/runs/{run_id}/overrides` | `POST` | `postOverride(runId, teamId, action, reason)` | [Scoring Explained](file:///docs/scoring-explained.md) |
| **List Overrides** | `/api/runs/{run_id}/overrides` | `GET` | *(None)* | [Scoring Explained](file:///docs/scoring-explained.md) |
| **Final Order** | `/api/runs/{run_id}/final` | `GET` | `getFinalRunOrder(runId)` | [Scoring Explained](file:///docs/scoring-explained.md) |
| **Live Re-Rank** | `/api/rank/` | `POST` | `recomputeLiveRank(runId, config, includeSensitivity)` | [Demo Scenario](file:///docs/demo-scenario.md) |
| **Start Enrich** | `/api/enrich/` | `POST` | *(None)* | [Data Sources](file:///docs/data-sources.md) |
| **Enrich Status** | `/api/enrich/{job_id}` | `GET` | *(None)* | [Data Sources](file:///docs/data-sources.md) |
| **Compare** | `/api/compare/` | `POST` | `compareConfigurations(...)` | [Scoring Explained](file:///docs/scoring-explained.md) |
| **Export** | `/api/runs/{run_id}/export` | `GET` | `getExportDownloadUrl(...)` | [Demo Script](file:///docs/demo-script.md) |
| **Verify Run** | `/api/runs/{run_id}/verify` | `POST` | `verifyRunReproducibility(runId)` | [Deploy Guide](file:///docs/deploy.md) |
