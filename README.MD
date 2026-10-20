# Incursion Track 3: Team Recruitment Automation Tool

A configurable, explainable, team-level recruitment and shortlisting platform built with **FastAPI**, **Next.js**, and **PostgreSQL (Supabase)**.

This tool evaluates hackathon and competition team registrations across multi-dimensional criteria (technical skills, projects, GitHub commits, achievements, and portfolio links). It replaces opaque black-box scoring with deterministic, reproducible, auditable rankings, real-time What-If sensitivity adjustments, and reviewer override controls.

---

## 1. Key Features

- **Robust Ingestion & Sanitization**:
  - Ingests CSV or JSON team registrations with link validation, URL normalization, and syntax guards.
  - Detects duplicate teams and cross-team candidate sharing (duplicate email, GitHub handle, or resume hash).
  - Flags missing or invalid links explicitly—never penalizing candidates with silent zeros.
- **Configurable Scoring Engine**:
  - Customizable criteria weights, skill keywords, and tie-breaking chains.
  - Three distinct missing-data policies: `redistribute` (default), `neutral`, and `penalty`.
  - Team aggregation methods: `mean` (default) and `highest_member`.
  - Independent boolean eligibility rules (e.g., minimum team size).
- **Explainability & Reviewer Workflows**:
  - Interactive Team Detail Drawer displaying criterion contribution percentages, cutoff gap, top strengths, and weakest areas.
  - Manual reviewer overrides (`pin`, `exclude`, `waitlist`) with mandatory audit reasons, preserving original automated rankings side-by-side with final ranks.
  - **Blind Mode**: One-click anonymization masking team and candidate identities to reduce reviewer bias.
- **Live What-If Re-Ranking & Comparison**:
  - In-memory re-ranking from cached profile values without modifying stored database runs.
  - Dynamic rank delta badges (`+4`, `-2`, `Entered Top X`, `Left Top X`).
  - Automated sensitivity analysis checking status changes under +/- 5% weight shifts.
  - Side-by-side strategy configuration comparison and pairwise team difference breakdowns.
- **Cryptographic Reproducibility & Auditable Exports**:
  - Deterministic SHA-256 `run_hash` generated for every evaluation run.
  - One-click cryptographic verification recomputing pipeline output against stored hashes.
  - Multi-format exports (CSV, JSON) and reproducible ZIP bundles containing `results.csv`, `results.json`, `config.json`, and `manifest.json`.
- **Safe Signal Extractions**:
  - PDF resume text extraction via PyMuPDF with size caps (10MB) and non-PDF guards.
  - GitHub REST API profile enrichment with rate-limit backoff and local disk caching.
  - Reachability and project section detection for portfolio links.
  - Optional Gemini 2.5 Flash extraction with deterministic anti-hallucination quote verification (Gemini never computes scores).

---

## 2. System Architecture

```mermaid
graph TD
    A["Frontend (Next.js 16 / React 19)"] -->|HTTP / JSON| B["Backend API (FastAPI)"]
    B -->|Persist Datasets, Configs, Runs, Overrides| C["Database (PostgreSQL / Supabase)"]
    B -->|Signal Extraction & Caching| D["Local File Cache (cache/)"]
    B -.->|Public API Requests| E["GitHub REST API"]
    B -.->|Optional LLM Verification| F["Gemini 2.5 Flash API"]
```

- **Backend**: Python 3.11, FastAPI, Uvicorn, Pydantic v2, Pandas, PyMuPDF, BeautifulSoup4, Requests.
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide React.
- **Database**: PostgreSQL with Supabase (local CLI or hosted cloud instance).
- **Caching**: Local filesystem cache under `cache/` storing raw resume texts, GitHub API payloads, portfolio check results, and enrichment background job progress.

---

## 3. Repository Folder Map

```
Incursion-1/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI routers (upload, configs, runs, overrides, rank, enrich, compare, export, verify)
│   │   ├── blind/           # Anonymization routines for blind review mode
│   │   ├── core/            # Pipeline orchestration, hashing, background jobs, ZIP exporter
│   │   ├── db/              # Supabase database client and repository queries
│   │   ├── ingest/          # CSV/JSON file loader, Pydantic models, and validation logic
│   │   ├── scoring/         # Pure scoring engine (weighted, aggregate, missing, eligibility, ranking, whatif, compare)
│   │   └── main.py          # Application entrypoint and CORS middleware
│   ├── Dockerfile           # Backend container build file
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── app/                 # Next.js pages (/upload, /config, /results, /history, /compare)
│   ├── components/          # Reusable UI components (Tables, Drawers, Sliders, Badges, Modals)
│   ├── hooks/               # Custom React hooks (useLiveRank)
│   ├── lib/                 # Frontend API client (api.ts) and TypeScript interfaces (types.ts)
│   ├── Dockerfile           # Frontend development container build file
│   └── package.json         # Node.js dependencies and scripts
├── integrations/            # External signal extractors (PyMuPDF, GitHub, Portfolio, Gemini, Cache)
├── docs/                    # Architecture contracts, scoring formulas, and guides
│   ├── api-contract.md      # Complete REST API specification
│   ├── profile-contract.md  # Ingested candidate profile and signal schemas
│   ├── scoring-explained.md # Math, missing policies, and ranking logic
│   ├── data-sources.md      # External API limits, timeouts, and safeguards
│   ├── demo-scenario.md     # What-If live demo walkthrough
│   ├── demo-script.md       # 8-step demo execution script
│   ├── deploy.md            # Deployment instructions & production readiness
│   └── test-report.md       # Scale benchmarks and known issues log
├── samples/
│   ├── demo_configs/        # Sample configuration strategies (skills_heavy.json, projects_heavy.json)
│   ├── edge_cases/          # Edge-case verification datasets
│   └── synthetic_100.csv    # 100-team synthetic registration dataset
├── scripts/
│   ├── make_synthetic.py    # Synthetic CSV generator and 100/500/1000 scale benchmark script
│   └── prewarm_demo_cache.py# Demo cache population script
├── temp_supabase/           # Supabase local configuration, schema.sql, and seed.sql
├── docker-compose.yml       # Full-stack local Docker Compose specification
└── .env.example             # Template for required environment variables
```

---

## 4. Prerequisites

- **Python**: Version 3.11 or higher
- **Node.js**: Version 18 or higher (Node 20 recommended) with `npm`
- **Docker & Docker Compose**: Optional, for running containerized services
- **Database**:
  - Local Supabase CLI (`brew install supabase/tap/supabase` or `npm install -g supabase`), **OR**
  - Any standard PostgreSQL 15+ instance / Supabase Cloud project

---

## 5. Environment Configuration

1. Create a `.env` file in the repository root by copying `.env.example`:
   ```bash
   cp .env.example .env
   ```

2. Populate the required environment variables using safe placeholder values:
   ```ini
   # Supabase Database Configuration
   SUPABASE_URL=http://127.0.0.1:54321
   SUPABASE_KEY=your-anon-or-service-role-key
   DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres

   # External Integrations (Optional for offline demo)
   GITHUB_TOKEN=your_github_personal_access_token_here
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

> [!CAUTION]
> Never commit real secrets or credentials to version control. The `.env` file is excluded from Git.

---

## 6. Local Development Setup

### Step 1: Database Initialization

The database schema and initial seed data are stored in [`temp_supabase/`](file:///temp_supabase/).

#### Option A: Using the Supabase CLI (Recommended for local dev)
1. Initialize the standard Supabase directory from `temp_supabase`:
   ```bash
   cp -r temp_supabase supabase
   supabase start
   ```
2. Execute the schema migration and default preset seed:
   ```bash
   supabase db execute -f temp_supabase/schema.sql
   supabase db execute -f temp_supabase/seed.sql
   ```
   *(Alternatively, open Supabase Studio at `http://localhost:54323`, navigate to the SQL Editor, and execute `temp_supabase/schema.sql` followed by `temp_supabase/seed.sql`).*

#### Option B: Using an Existing PostgreSQL or Remote Supabase Instance
Connect to your database via `psql` or the Supabase dashboard and run the scripts in order:
```bash
psql "$DATABASE_URL" -f temp_supabase/schema.sql
psql "$DATABASE_URL" -f temp_supabase/seed.sql
```

> [!NOTE]
> All tables in `temp_supabase/schema.sql` explicitly disable Row Level Security (`DISABLE ROW LEVEL SECURITY`) to allow the backend API to query the database using the anon key.

---

### Step 2: Backend Setup

1. Open a terminal in the repository root:
   ```bash
   python3.11 -m venv .venv
   source .venv/bin/activate
   ```
2. Install Python dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```
3. Start the FastAPI development server:
   ```bash
   uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
4. Verify backend health:
   ```bash
   curl http://localhost:8000/health
   # Returns: {"status": "healthy", "database": "supabase"}
   ```

---

### Step 3: Frontend Setup

1. Open a separate terminal in the `frontend/` directory:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Next.js development server:
   ```bash
   npm run dev
   ```
3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

### Alternative: Full-Stack Docker Compose

You can launch both the backend and frontend simultaneously using Docker Compose:

```bash
docker-compose up --build
```

- Backend API: `http://localhost:8000`
- Frontend UI: `http://localhost:3000`

> [!IMPORTANT]
> When using Docker Compose, ensure your `.env` contains valid connection parameters pointing to an accessible Supabase or PostgreSQL host. Refer to [Deployment Guide](file:///docs/deploy.md) for network details.

---

## 7. Interactive API Documentation

FastAPI automatically generates interactive API documentation from code models:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **Complete Contract**: [docs/api-contract.md](file:///docs/api-contract.md)

---

## 8. Testing & Validation Commands

### Scale Benchmark & Synthetic Generator
Run the built-in synthetic dataset generator and scale benchmark:
```bash
python -m scripts.make_synthetic
```
This tests loader performance, link validation, and scoring speed across 100, 500, and 1,000 teams.

### Frontend Production Build Test
Verify TypeScript compilation and Next.js production build:
```bash
cd frontend
npm run build
```

---

## 9. Sample Datasets & Presets

The [`samples/`](file:///samples/) directory includes pre-generated files ready for testing:
- **`samples/synthetic_100.csv`**: A 100-team dataset with variable team sizes (1–3 members), missing fields, duplicate emails, and sample GitHub/portfolio links. Ready for direct upload on `/upload`.
- **`samples/demo_configs/skills_heavy.json`**: Strategy preset weighted heavily toward technical keywords.
- **`samples/demo_configs/projects_heavy.json`**: Strategy preset emphasizing portfolio projects and open-source contributions.
- **`samples/edge_cases/edge_cases_expected.json`**: Expected outputs for edge-case validation testing.

*(Note: Older documentation drafts occasionally referenced `samples/registrations_40.csv`, which is not included in the repository archive. Use `samples/synthetic_100.csv` for demoing and evaluation).*

---

## 10. Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| `Supabase error: relation "datasets" does not exist` | Database tables have not been created. | Execute `temp_supabase/schema.sql` against your PostgreSQL/Supabase database. |
| `FastAPI: 400 Only CSV and JSON files are supported` | Uploaded file extension is not `.csv` or `.json`. | Ensure your input file ends in `.csv` or `.json`. |
| `UnicodeDecodeError` when uploading CSV | File saved with non-UTF-8 encoding in Excel. | Ingest loader automatically tries `utf-8-sig`, `utf-8`, and `latin-1`. Re-save as CSV (UTF-8) if issues persist. |
| GitHub signals show `API_FAILED` | GitHub API rate limit exceeded (60 req/hr unauthenticated). | Add a valid `GITHUB_TOKEN` to your `.env` to increase limit to 5,000 req/hr. Cached profiles under `cache/` will still resolve. |
| Frontend displays `Failed to fetch` | Backend is not running or CORS blocked. | Ensure `uvicorn` is active on port 8000 and `NEXT_PUBLIC_API_URL` points to `http://localhost:8000/api`. |

---

## 11. Documentation Directory

- [API Specification Contract](file:///docs/api-contract.md)
- [Profile & Signal Contract](file:///docs/profile-contract.md)
- [Scoring Engine Explained](file:///docs/scoring-explained.md)
- [External Data Sources & Safeguards](file:///docs/data-sources.md)
- [Live Demo Scenario Walkthrough](file:///docs/demo-scenario.md)
- [8-Step Demo Script](file:///docs/demo-script.md)
- [Deployment & Compose Guide](file:///docs/deploy.md)
- [Scale & Edge-Case Test Report](file:///docs/test-report.md)