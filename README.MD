# Incursion Track 3: Team Recruitment Automation Tool

A configurable, explainable, and deterministic team-level recruitment and shortlisting platform built with **FastAPI**, **Next.js**, and **PostgreSQL (Supabase)**[cite: 1, 17].

Designed for hackathons and technical competitions, this tool evaluates team registrations across multi-dimensional criteria (technical skills, projects, GitHub activity, achievements, and portfolio links)[cite: 4, 17]. It replaces opaque black-box scoring with deterministic, reproducible, auditable rankings, real-time What-If sensitivity adjustments, and human-in-the-loop override controls[cite: 1, 17].

> ⚠️ **Desktop Optimization Notice:** This tool is designed as a data-dense organizer dashboard featuring multi-column comparison tables, interactive weight sliders, and side-by-side audit drawers[cite: 4, 8]. **It is not optimized for mobile screens**—please view and operate the platform on a desktop or laptop browser for the intended experience.

---

## 🛠 1. Tech Stack & System Architecture

```mermaid
graph TD
    A["Frontend (Next.js 16 / React 19)"] -->|HTTP / JSON| B["Backend API (FastAPI)"]
    B -->|Persist Datasets, Configs, Runs, Overrides| C["Database (PostgreSQL / Supabase)"]
    B -->|Signal Extraction & Caching| D["Local File Cache (cache/)"]
    B -.->|Public API Requests| E["GitHub REST API"]
    B -.->|Optional LLM Verification| F["Gemini 2.5 Flash API"]
```

* **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide React[cite: 17].
* **Backend:** Python 3.11, FastAPI, Uvicorn, Pydantic v2, Pandas[cite: 17].
* **Database:** PostgreSQL 15+ via Supabase (uses schema-less `JSONB` columns across 4 core tables: `datasets`, `configurations`, `runs`, and `overrides` with Row Level Security disabled for rapid API access)[cite: 2, 4, 17].
* **Profile Intelligence & Parsing:** PyMuPDF (`fitz`) for PDF text extraction[cite: 5, 17], BeautifulSoup4 & Requests for portfolio scraping[cite: 7, 17], GitHub REST API v3[cite: 6, 17], and optional Google Gemini 2.5 Flash (`temperature=0`) with deterministic quote verification[cite: 7, 17].
* **Local File Cache:** Disk cache under `cache/` storing extracted resume text, GitHub responses, portfolio checks, and enrichment job progress keyed by SHA-256 URL hashes[cite: 2, 5, 17].
* **Deployment:** Vercel (Frontend), Render (Backend), Supabase Cloud (Database), Docker & Docker Compose[cite: 8, 17].

---

## 🚀 2. How to View & Run the Project

### A. Viewing the Live Deployment
* **Live Frontend Web App (Vercel):** `https://incursion-ten.vercel.app/upload`
* **Live Backend Interactive API Docs (Render Swagger UI):** `https://incursion-backend.onrender.com/docs`
* **Live Backend Health Check:** `https://incursion-backend.onrender.com/health`[cite: 4, 17]

*(Note: Because the backend is hosted on Render's free tier, it spins down after 15 minutes of inactivity. Your first action after an idle period may take **30–50 seconds** while the container wakes up).*

### B. Running Locally (Step-by-Step)

#### 1. Environment Configuration
Copy `.env.example` to `.env` in the repository root[cite: 3, 17]:
```bash
cp .env.example .env
```
Populate `.env` with your credentials[cite: 4, 17]:
```ini
# Supabase Database Configuration
SUPABASE_URL=[https://your-project.supabase.co](https://your-project.supabase.co)
SUPABASE_KEY=your-anon-or-service-role-key
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# External Integrations (Optional for offline demo)
GITHUB_TOKEN=your_github_personal_access_token_here
GEMINI_API_KEY=your_gemini_api_key_here
```

#### 2. Database Initialization
Execute the schema and preset seed scripts in `temp_supabase/` against your Supabase or PostgreSQL instance (via the Supabase SQL Editor or `psql`)[cite: 17]:
```bash
psql "$DATABASE_URL" -f temp_supabase/schema.sql
psql "$DATABASE_URL" -f temp_supabase/seed.sql
```

#### 3. Start the Backend (Terminal 1)
```bash
python3.11 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r backend/requirements.txt
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 4. Start the Frontend (Terminal 2)
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:3000`** on a desktop browser[cite: 17]. *(Alternatively, run `docker-compose up --build` from the root directory to launch both containers simultaneously)[cite: 5, 8, 17].*

---

## 🔄 3. End-to-End Tool Workflow, Calculations & UI Controls

The application operates as a deterministic 5-stage pipeline: **Upload → Configure → Evaluate & Explain → Simulate & Override → Compare, Verify & Export**[cite: 1, 4, 8, 17].

---

### Stage 1: Upload & Sanitize (`/upload`)
Organizers upload candidate registration sheets in **CSV** (Google Forms flat format supporting variable team sizes from solo to 6+ members) or **JSON** format (such as `samples/synthetic_100.csv` or `samples/registrations_real_120.csv`)[cite: 4, 17].

* **What Happens Behind the Scenes:**
  1. **Safe Parsing (`loader.py`):** Enforces a 10MB file size limit, automatically falls back across `utf-8-sig`, `utf-8`, and `latin-1` encodings (preventing Excel export crashes), and converts rows into normalized `Team` and `Member` structures[cite: 4, 8, 17].
  2. **Link Validation & Duplicate Detection (`validate.py`):** Checks URLs for valid syntax, extracts clean GitHub usernames from profile/repo URLs, and scans for duplicate team names, duplicate member emails, and duplicate GitHub handles[cite: 4, 17].
  3. **Explicit Status Flagging (`flags.py`):** Missing or malformed links are never left blank or scored as silent zeros—they are explicitly marked as `MISSING` or `INVALID`[cite: 4, 5, 17].
  4. **Deduplicated Storage (`upload.py`):** Computes a `SHA-256` `content_hash` of the raw file and saves the dataset and validation report to Supabase[cite: 2, 5, 8]. Uploading the exact same file twice safely returns the existing dataset record[cite: 8].
* **What Each UI Element & Button Does:**
  * **`Select File` Button:** Opens the file dialog, uploads the CSV/JSON to `POST /api/upload`, and renders the preview[cite: 4, 5].
  * **Summary Cards:** Displays total teams parsed, duplicate teams detected, and total missing links[cite: 5].
  * **Validation Report Banner:** Lists row-level warnings (e.g., duplicate emails or GitHub usernames)[cite: 4, 5].
  * **Parsed Teams Table:** Displays each team's ID, name, member count, and a grey **`Missing Data`** badge (if any member is missing a link) or green **`Complete`** badge[cite: 5].
  * **`Continue to Configuration →` Button:** Saves the active `dataset_id` in browser `localStorage` and advances to `/config`[cite: 5].

---

### Stage 2: Configure Scoring Strategy (`/config`)
Organizers customize the evaluation rubric or load a saved preset[cite: 4, 5, 17].

* **What Is Configured:**
  * **Criteria & Keywords:** Five default criteria (*Technical Skills*, *Projects and Experience*, *GitHub Activity*, *Achievements*, *Portfolio*)[cite: 4]. Organizers can define target skill keywords (e.g., `python, react, fastapi, go`) for the resume parser[cite: 2, 4, 6].
  * **Criterion Weights (`0–100`):** Must sum to **exactly 100** (enforced by both live UI validation and `config_validate.py`)[cite: 4].
  * **Top-X Cutoff:** Number of top-ranked eligible teams to mark as `Shortlisted`[cite: 4, 6].
  * **Team Aggregation Method:**
    * `Mean` (Default): Arithmetic average of all members' scores in the team[cite: 4, 5, 17].
    * `Weighted Mean` / `Highest Member`: Evaluates teams based on weighted roles or the top specialist's score[cite: 5, 17].
  * **Missing-Data Policy:** Determines how `MISSING` or `UNAVAILABLE` signals are handled during scoring[cite: 4, 5, 17]:
    * `Redistribute` (Default): Proportionally shifts the weight of missing criteria onto the candidate's available criteria so they are not unfairly penalized[cite: 5, 17].
    * `Neutral`: Assigns the average score of the candidate's present criteria to the missing criterion[cite: 5, 17].
    * `Penalty`: Scores missing criteria as `0`[cite: 5, 17].
* **What Each UI Element & Button Does:**
  * **`Load Strategy Preset` Dropdown:** Fetches presets (`Balanced Default`, `Skills Heavy`, `Projects Heavy`) from `GET /api/configs` and populates the form[cite: 4, 5, 17].
  * **`+ Add Criterion` / Trash Icon:** Dynamically adds or deletes custom criteria rows[cite: 4].
  * **Weight Sliders & Number Inputs:** Adjusts criterion weights in real time; the total counter turns green at `100 / 100` and red otherwise[cite: 4].
  * **`Save Configuration` Button:** Validates and saves the strategy to Supabase via `POST /api/configs`, storing `current_config_id`[cite: 4, 5].
  * **`Run Evaluation` Button:** Calls `POST /api/runs` with `dataset_id` and `config_id` to execute the scoring pipeline and redirect to `/results`[cite: 6].

---

### Stage 3: How Signals & Scores Are Calculated (Backend Pipeline)
When an evaluation run is triggered (or pre-enriched via `POST /api/enrich`), the backend executes a deterministic calculation sequence[cite: 6, 7]:

#### 1. Profile Signal Extraction & Verification (`integrations/`)
* **PDF Resumes (`resume_text.py` & `resume_parser.py`):** Downloads public PDF links (10MB cap, 8s timeout, magic-byte `%PDF` check, private Google Drive HTML guard) and extracts raw text via PyMuPDF[cite: 5, 8, 17]. Matches skills against organizer keywords and detects project/achievement sections, recording character offsets and verbatim text snippets[cite: 6, 17]. Scanned PDFs without text are flagged `NO TEXT`[cite: 5].
* **Optional Gemini Verification (`gemini_extract.py`):** If enabled, calls `gemini-2.5-flash` at `temperature: 0.0` requesting JSON skills, projects, and achievements with an exact `quote`[cite: 7, 17]. Deterministic Python code checks if the normalized quote exists verbatim in the resume text—if not, the signal is downgraded to `UNCERTAIN`[cite: 1, 7, 17].
* **GitHub Activity (`github_client.py` & `github_analysis.py`):** Fetches public profile and repository data with exponential backoff and local caching[cite: 6, 8, 17]. Filters out forked repos to count `original_repos`, total stars, languages, and approximate 12-month commits[cite: 6]. Adds non-penalizing review flags (`NO_REPOS`, `MOSTLY_FORKS`, `NO_RECENT_ACTIVITY`) if anomalies are found[cite: 6].
* **Portfolio Check (`portfolio_check.py`):** Scrapes portfolio URLs via BeautifulSoup to verify HTTP reachability, page `<title>`, and presence of project/work sections[cite: 7, 17].

#### 2. Signal Normalization (`signal_mapping.py`)
Raw member signals are mapped onto a **0 to 100** scale per criterion[cite: 4, 6]:
* **Technical Skills:** `min((Matched Keywords / 5) * 100, 100)`[cite: 6]
* **Projects & Experience:** `min((Projects Found / 3) * 100, 100)`[cite: 6]
* **GitHub Activity:** `min((Commits_12m / 500) * 100, 100)`
* **Achievements:** `min((Achievements Found / 2) * 100, 100)`
* **Portfolio:** `100.0` if reachable and contains project sections, else `0.0`.

#### 3. Member Score & Missing-Data Policy (`missing.py` & `weighted.py`)
After applying the chosen Missing-Data Policy (`redistribute`, `neutral`, or `penalty`) to produce adjusted values (`V'_i`) and adjusted weights (`W'_i`), each member's score and per-criterion point contribution are calculated[cite: 4, 5]:
```text
Member Score = Sum( (V'_i / 100) * W'_i )
```

#### 4. Team Aggregation & Cross-Team Duplicate Check (`aggregate.py` & `duplicates.py`)
Individual member scores are aggregated into the `team_score`[cite: 4, 5]:
```text
Team Score (Mean) = Sum(Member Score_j) / Team Size
```
Solo teams (1 member), large teams (5+ members), and cross-team duplicate candidates (same email, GitHub, or resume hash across multiple teams) are appended to `missing_warnings`[cite: 5, 8, 17].

#### 5. Separate Hard Eligibility Check (`eligibility.py`)
Boolean eligibility rules (`>`, `<`, `>=`, `<=`, `==`, `contains` across `team`, `any_member`, or `all_members`) are evaluated strictly separately from weighted scores[cite: 4, 5, 9]:
* Fails a rule $\rightarrow$ **`Ineligible`** (records exact failed rule and actual value)[cite: 5].
* Missing/uncertain signal prevents rule check $\rightarrow$ **`Needs review`**[cite: 5].
* Passes all rules $\rightarrow$ **`Eligible`**[cite: 5].

#### 6. Deterministic Ranking, Explanations & Hashing (`ranking.py`, `explain.py`, `hashing.py`)
* Eligible teams are sorted by `team_score` descending[cite: 6]. Ties are resolved using the `tie_break` chain, always ending with `team_id` ascending so identical inputs always yield the exact same order[cite: 1, 6, 8].
* Teams with `Rank <= Top X` are marked **`Shortlisted`**; remaining eligible teams are marked **`Not shortlisted`**[cite: 6].
* **`explain.py`** computes each criterion's percentage share of the total score, top two strengths, weakest criterion, and exact point gap to the Top-X cutoff score, assembling a deterministic explanation sentence[cite: 6, 17].
* **`hashing.py`** generates a canonical `SHA-256` `run_hash` from `(dataset_id, config_json)` and stores the run in Supabase[cite: 2, 5, 6, 17].

---

### Stage 4: Results Dashboard, Live What-If & Manual Overrides (`/results`)
The interactive reviewer dashboard for inspecting rankings, simulating weight changes, and applying auditable human decisions[cite: 6, 7, 8, 17].

* **What Each UI Element & Button Does:**
  * **`Blind Mode: ON / OFF` Toggle:** Masks all identifying team names, member emails, and profile URLs with deterministic hashes (`Blind Team #TM-...`) for bias-free review[cite: 8, 17].
  * **What-If Simulator (Live Re-Rank Panel):**
    * **Interactive Weight Sliders & `Top-X Cutoff` Input:** Debounces slider adjustments (300ms) and calls `POST /api/rank` to recompute rankings on the fly from cached member criterion values without modifying stored database records[cite: 6, 8, 17].
    * **Rank Shift Badges (`RankDelta.tsx`):** Displays green **`+N`** or red **`-N`** rank delta badges alongside **`Entered Top X`** (emerald row highlight) and **`Left Top X`** (rose row highlight) pills[cite: 7, 8, 17].
    * **`Reset` Button:** Restores weights and rankings back to the stored baseline run[cite: 8].
    * **`Save as new configuration` Button:** Saves the experimental What-If weights as a new preset in Supabase[cite: 8].
  * **Status Filter Tabs (`All`, `Shortlisted`, `Not shortlisted`, `Needs review`, `Ineligible`, `Needs review queue`):** Filters the table by status or switches to the dedicated **Review Queue** view (`ReviewQueue.tsx`) displaying color-coded warning badges (`MISSING`, `INVALID`, `UNCERTAIN`, `NEEDS_REVIEW`)[cite: 6, 8].
  * **Row Click (Expandable Score Breakdown):** Clicking any team row expands horizontal progress bars (`ScoreBreakdown.tsx`) showing exact points and percentage share per criterion[cite: 6, 8].
  * **Manual Override Buttons (`Pin`, `Waitlist`, `Exclude`):**
    * Clicking any override button opens a modal (`OverrideDialog.tsx`) requiring a mandatory written audit reason and submits to `POST /api/runs/{id}/overrides`[cite: 6, 7, 17].
    * **Auditable & Non-Destructive:** Overrides never overwrite automated scores[cite: 2, 6, 17]. The table displays both **`Final Rank`** and **`(Auto #Rank)`** side-by-side along with an indigo override badge (hovering shows the organizer's reason)[cite: 6, 7, 8, 17].
  * **`Inspect` Button (Team Detail Drawer):** Opens a slide-over panel (`TeamDrawer.tsx`) displaying the team's total score, cutoff gap, full explanation summary, top strengths, weakest area, eligibility rule pass/fail checks, missing data warnings, and per-member criterion values[cite: 8, 17].
  * **Pagination Controls (`Prev` / `Next`):** Smoothly paginates 1,000+ team datasets (25 teams per page) without browser lag[cite: 8].
  * **Export Bar (`Shortlist`, `Waitlist`, `Rejected`, `Full Breakdown` in `CSV` / `JSON`, plus `Reproducible ZIP Bundle`):**
    * Calls `GET /api/runs/{id}/export` to download override-aware results (respecting Blind Mode if toggled on)[cite: 8, 17].
    * **`Reproducible ZIP Bundle` Button:** Downloads a ZIP archive containing `results.csv`, `results.json`, `config.json`, and `manifest.json` (`dataset_hash`, `config_hash`, `run_hash`, timestamp, and record count)[cite: 8, 17].

---

### Stage 5: Strategy Comparison (`/compare`) & Reproducibility History (`/history`)

* **Compare Page (`/compare`):**
  * Select a **Baseline Run**, **Configuration A** (e.g., *Skills Heavy*), and **Configuration B** (e.g., *Projects Heavy*), then click **`Compare Ranks`** (`POST /api/compare`)[cite: 8, 17].
  * Renders a side-by-side rank-difference table showing each team's Rank/Score under Config A, Rank/Score under Config B, net rank shift badge, and status transition (`Status A → Status B`)[cite: 8, 17].
* **History Page (`/history`):**
  * Displays all past evaluation runs with their Run ID, Dataset ID, `SHA-256` Run Hash, and creation timestamp[cite: 2, 6, 8].
  * **`Verify Hash` Button:** Calls `POST /api/runs/{id}/verify`, which re-executes the stored dataset and configuration snapshot through the pipeline and verifies that both the input `run_hash` and canonical output hash match 100%—rendering a green **`Verified Deterministic`** badge[cite: 8, 17].
  * **`Open Results` Link:** Navigates directly to `/results?run_id=...` for that historical run.

---

## 📂 4. Repository Folder Map

```text
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
├── samples/                 # Synthetic CSVs (synthetic_100.csv), demo_configs/, and edge_cases/
├── scripts/                 # Synthetic generator (make_synthetic.py) & cache warmer (prewarm_demo_cache.py)
├── temp_supabase/           # Supabase local configuration, schema.sql, and seed.sql
├── docker-compose.yml       # Full-stack local Docker Compose specification
└── .env.example             # Template for required environment variables
```

---

## 🛠 5. Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| `Supabase error: relation "datasets" does not exist` | Database tables have not been created[cite: 17]. | Execute `temp_supabase/schema.sql` and `temp_supabase/seed.sql` in your Supabase SQL Editor[cite: 17]. |
| `FastAPI: 400 Only CSV and JSON files are supported` | Uploaded file extension is not `.csv` or `.json`[cite: 17]. | Ensure your registration file ends in `.csv` or `.json`[cite: 17]. |
| GitHub signals show `API_FAILED` | GitHub API unauthenticated rate limit exceeded (60 req/hr)[cite: 17]. | Add a valid `GITHUB_TOKEN` to `.env` (increases limit to 5,000 req/hr)[cite: 17]. Cached profiles in `cache/` still resolve offline[cite: 17]. |
| Frontend displays `Failed to fetch` or takes ~40s on first load | Backend is not running locally, or Render free-tier container is waking from sleep[cite: 17]. | Verify `uvicorn` is running on port 8000 (local) or wait ~40 seconds for Render to wake up, then refresh. |
