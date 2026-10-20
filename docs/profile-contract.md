# Candidate Profile & Signal Contract

This document specifies the exact candidate profile data structures, external integration signal schemas, extraction safeguards, and scoring mappings implemented in the Incursion Track 3 platform.

It is derived directly from:
- Ingest models: [`backend/app/ingest/models.py`](file:///backend/app/ingest/models.py)
- Status flags: [`backend/app/ingest/flags.py`](file:///backend/app/ingest/flags.py)
- Signal aggregation: [`integrations/signals.py`](file:///integrations/signals.py)
- Integration modules:
  - [`integrations/resume_text.py`](file:///integrations/resume_text.py)
  - [`integrations/resume_parser.py`](file:///integrations/resume_parser.py)
  - [`integrations/github_client.py`](file:///integrations/github_client.py)
  - [`integrations/github_analysis.py`](file:///integrations/github_analysis.py)
  - [`integrations/portfolio_check.py`](file:///integrations/portfolio_check.py)
  - [`integrations/gemini_extract.py`](file:///integrations/gemini_extract.py)
- Pipeline & Mapping:
  - [`backend/app/scoring/signal_mapping.py`](file:///backend/app/scoring/signal_mapping.py)
  - [`backend/app/core/pipeline.py`](file:///backend/app/core/pipeline.py)

---

## 1. Ingestion Data Shapes

### 1.1 Candidate Member Model (`backend/app/ingest/models.py`)
Each team is composed of individual members. During file loading and validation, raw CSV columns (`member_{i}_*`) or JSON objects are parsed into Pydantic `Member` instances:

```json
{
  "name": "Alex Mercer",
  "email": "alex.mercer@example.com",
  "github": "alexm-dev",
  "resume": "https://example.com/resumes/alex_mercer.pdf",
  "linkedin": "https://linkedin.com/in/alexmercer",
  "portfolio": "https://alexmercer.dev"
}
```

#### Field Specifications:
- `name` (string, required): Member full name.
- `email` (string, required): Member email (used as candidate key for caching and scoring).
- `github` (string, optional, default: `null`): GitHub handle or URL. The validator in [`backend/app/ingest/validate.py`](file:///backend/app/ingest/validate.py) automatically strips URLs down to the raw handle (e.g. `https://github.com/octocat/` -> `octocat`). If invalid, replaced with `"INVALID"`; if blank or missing, replaced with `"MISSING"`.
- `resume` (string, optional, default: `null`): Direct URL to a PDF resume. Validated for URL syntax.
- `linkedin` (string, optional, default: `null`): Validated for URL syntax only. Never scraped.
- `portfolio` (string, optional, default: `null`): Personal website or project portfolio URL.

### 1.2 Team Model (`backend/app/ingest/models.py`)
```json
{
  "team_id": "T0104",
  "team_name": "Distributed Neurons",
  "members": [ ... ]
}
```
- `team_id` (string, required): Unique identifier (e.g., `"T0001"`).
- `team_name` (string, required): Team display name.
- `members` (list of `Member`, required): List of 1 to 8 candidate members.

---

## 2. Standardized Status Flags

All signal statuses in the codebase inherit from [`backend/app/ingest/flags.py:StatusFlag`](file:///backend/app/ingest/flags.py):

| Status Flag | Meaning | Typical Causes |
| :--- | :--- | :--- |
| `OK` | Valid data successfully retrieved and verified. | Valid HTTP 200 responses, verified quotes, reachable URLs. |
| `MISSING` | Candidate did not supply a link or field. | Blank cell in CSV, null field in JSON, or empty string. |
| `INVALID` | Value format is malformed or unresolvable. | Malformed URL string, 404 Not Found, non-PDF file content. |
| `UNAVAILABLE` | External resource exists but cannot be accessed. | Private Google Drive sign-in redirect, HTTP 401/403, PDF > 10MB. |
| `UNCERTAIN` | Data extracted by LLM or heuristics could not be verified verbatim. | Gemini returned a quote that does not exist verbatim in the text. |
| `API_FAILED` | Network or remote service failure. | Rate limit exceeded (GitHub HTTP 429), gateway timeout, DNS failure. |
| `NO TEXT` | PDF binary was parsed but contains 0 text characters. | Scanned image PDF without embedded text layer (no OCR fabrication). |

---

## 3. The Member Signal Object Contract

When signals are collected by [`integrations/signals.py:build_member_signals`](file:///integrations/signals.py#L11), a uniform signal dictionary is constructed for each extracted attribute:

```json
{
  "name": "<signal_name>",
  "value": <typed_value>,
  "status": "<StatusFlag>",
  "source": "<source_identifier>",
  "confidence": <float_between_0.0_and_1.0>
}
```

### 3.1 Supported Signal Names & Structures

Only the following signal names and structures are emitted by the implementation in `integrations/signals.py`:

#### 1. `skills_matched`
- **Source**: `"resume_parser"`
- **Value**: List of objects. Each object provides character offset and verbatim snippet provenance:
  ```json
  [
    {
      "value": "python",
      "offset": 450,
      "snippet": "Experienced in developing backend services using Python and FastAPI for high-throughput"
    }
  ]
  ```
- **Value Type**: `List[Dict[str, Any]]`
- **Supported Statuses**: `OK`, `UNCERTAIN`.
- **Confidence**: `0.9` if at least one skill matched; `0.4` if empty list.

#### 2. `projects_found`
- **Source**: `"resume_parser"`
- **Value**: List of objects representing detected project sections with snippet provenance:
  ```json
  [
    {
      "value": "Found Project Section",
      "offset": 1024,
      "snippet": "Distributed Cache Implementation: Built a Raft-consensus key-value store in Go..."
    }
  ]
  ```
- **Value Type**: `List[Dict[str, Any]]`
- **Supported Statuses**: `OK`, `UNCERTAIN`.
- **Confidence**: `0.8`.

#### 3. `achievements_found`
- **Source**: `"resume_parser"`
- **Value**: List of objects representing detected awards, honors, or achievements:
  ```json
  [
    {
      "value": "Found Achievements Section",
      "offset": 1820,
      "snippet": "1st Place Winner - HackTech 2025; Dean's List for Academic Excellence..."
    }
  ]
  ```
- **Value Type**: `List[Dict[str, Any]]`
- **Supported Statuses**: `OK`, `UNCERTAIN`.
- **Confidence**: `0.8`.

#### 4. `resume_data`
- **Source**: `"input"` (if link missing/invalid) or `"resume_text"` (if download/parsing failed)
- **Value**: `null`
- **Value Type**: `None`
- **Supported Statuses**: `MISSING`, `INVALID`, `UNAVAILABLE`, `API_FAILED`, or `"NO TEXT"`.
- **Confidence**: `1.0` if missing from input; `0.0` if download or extraction failed.
- *(Note: This signal is emitted in place of `skills_matched`, `projects_found`, and `achievements_found` whenever a resume cannot be read).*

#### 5. `github_commits`
- **Source**: `"github_api"`
- **Value**: Estimated 12-month public commit count derived from original repositories (`original_repos_count * 15`).
- **Value Type**: `int` (or `float`)
- **Supported Statuses**: `OK`, `MISSING`, `INVALID`, `UNAVAILABLE`, `API_FAILED`.
- **Confidence**: `0.85` if status is `OK`; `0.0` otherwise.

#### 6. `portfolio_valid`
- **Source**: `"portfolio_check"`
- **Value**: Boolean indicating if the portfolio website was reachable and contained project keywords (`project`, `portfolio`, `built`, `github`, `case study`, `experience`, `work`).
- **Value Type**: `bool`
- **Supported Statuses**: `OK`, `MISSING`, `INVALID`, `UNAVAILABLE`.
- **Confidence**: `0.9` if status is `OK`; `0.0` otherwise.

---

## 4. Signal Provenance, Offsets & Snippets

A fundamental principle of the system is deterministic explainability:

- **Offsets & Snippets**: Supplied **strictly** for resume text extractions ([`integrations/resume_parser.py`](file:///integrations/resume_parser.py) and [`integrations/gemini_extract.py`](file:///integrations/gemini_extract.py)).
  - `offset`: Exact 0-indexed integer character location where the keyword or section header begins in the raw extracted resume text.
  - `snippet`: Verbatim 60–100 character window surrounding the extracted keyword from the candidate's PDF.
- **GitHub & Portfolio**: Do **not** provide character offsets or snippet strings. GitHub signals provide structured numeric counts, repository metadata, and language lists from the GitHub REST API. Portfolio signals provide HTTP status, page title, and boolean keyword presence.

---

## 5. Signal Payload Examples

### 5.1 Fully Verified, Successful Profile Signals
```json
[
  {
    "name": "skills_matched",
    "value": [
      {
        "value": "python",
        "offset": 312,
        "snippet": "Proficient in Python, Go, and PostgreSQL database optimization"
      },
      {
        "value": "react",
        "offset": 380,
        "snippet": "Architected frontend micro-apps with React and Next.js"
      },
      {
        "value": "fastapi",
        "offset": 450,
        "snippet": "Designed REST APIs using FastAPI with OpenAPI contract generation"
      }
    ],
    "status": "OK",
    "source": "resume_parser",
    "confidence": 0.9
  },
  {
    "name": "projects_found",
    "value": [
      {
        "value": "Found Project Section",
        "offset": 920,
        "snippet": "Projects: Built a distributed queue processor capable of handling 50k RPS..."
      }
    ],
    "status": "OK",
    "source": "resume_parser",
    "confidence": 0.8
  },
  {
    "name": "achievements_found",
    "value": [
      {
        "value": "Found Achievements Section",
        "offset": 1450,
        "snippet": "Achievements: Finalist at Global Hack 2025; Published paper on LLM safety..."
      }
    ],
    "status": "OK",
    "source": "resume_parser",
    "confidence": 0.8
  },
  {
    "name": "github_commits",
    "value": 180,
    "status": "OK",
    "source": "github_api",
    "confidence": 0.85
  },
  {
    "name": "portfolio_valid",
    "value": true,
    "status": "OK",
    "source": "portfolio_check",
    "confidence": 0.9
  }
]
```

### 5.2 Missing Profile Signals (Candidate Provided No Links)
```json
[
  {
    "name": "resume_data",
    "value": null,
    "status": "MISSING",
    "source": "input",
    "confidence": 1.0
  },
  {
    "name": "github_commits",
    "value": 0,
    "status": "MISSING",
    "source": "github_api",
    "confidence": 0.0
  },
  {
    "name": "portfolio_valid",
    "value": false,
    "status": "MISSING",
    "source": "portfolio_check",
    "confidence": 0.0
  }
]
```

### 5.3 Unavailable / Rate-Limited Profile Signals
```json
[
  {
    "name": "resume_data",
    "value": null,
    "status": "UNAVAILABLE",
    "source": "resume_text",
    "confidence": 0.0
  },
  {
    "name": "github_commits",
    "value": 0,
    "status": "API_FAILED",
    "source": "github_api",
    "confidence": 0.0
  },
  {
    "name": "portfolio_valid",
    "value": false,
    "status": "UNAVAILABLE",
    "source": "portfolio_check",
    "confidence": 0.0
  }
]
```

### 5.4 Uncertain Profile Signals (Unverified LLM Claim)
```json
[
  {
    "name": "skills_matched",
    "value": [
      {
        "value": "kubernetes",
        "snippet": "Orchestrated container clusters across multiple regions",
        "status": "UNCERTAIN",
        "source": "gemini_verified",
        "confidence": 0.3
      }
    ],
    "status": "UNCERTAIN",
    "source": "resume_parser",
    "confidence": 0.9
  }
]
```

---

## 6. Optional Gemini 2.5 Flash Extraction & Quote Verification

The system provides an optional multimodal LLM extractor in [`integrations/gemini_extract.py`](file:///integrations/gemini_extract.py).

### 6.1 Deterministic Constraints
- **Model**: `gemini-2.5-flash`
- **Temperature**: Strictly `0.0`.
- **Payload Privacy**: Only extracted resume text is sent to the Gemini API. Candidate email, name, college, and team names are omitted from prompt templates.
- **Output Format**: Enforced via `responseMimeType: "application/json"`.

### 6.2 Anti-Hallucination Quote Verification Safeguard
Whenever Gemini extracts a skill, project, or achievement, it is mandated to return the exact verbatim quote:
```json
{
  "skills": [
    {
      "value": "FastAPI",
      "quote": "Implemented RESTful microservices with FastAPI"
    }
  ]
}
```
In [`integrations/gemini_extract.py:L56-L85`](file:///integrations/gemini_extract.py#L56-L85), deterministic Python code verifies the quote:
1. Normalizes whitespace and casing on both the candidate resume text and the returned quote:
   ```python
   norm_resume = " ".join(resume_text.split()).lower()
   norm_quote = " ".join(quote.split()).lower()
   ```
2. Checks substring containment: `if norm_quote and norm_quote in norm_resume:`
   - **Quote matches verbatim**: Assigned `status = StatusFlag.OK` and `confidence = 0.95`.
   - **Quote does NOT match**: Downgraded to `status = StatusFlag.UNCERTAIN` and `confidence = 0.3`.

### 6.3 Strict Role Boundary
Gemini **never** calculates numeric scores, criteria weights, rank adjustments, or shortlist decisions. It is strictly an assistive information extraction tool.

### 6.4 Execution Path Differences (Intended vs. Real Execution)
- **Synchronous Pipeline (`POST /api/runs/`)**:
  In [`backend/app/core/pipeline.py:L22`](file:///backend/app/core/pipeline.py#L22), `run_evaluation_pipeline` calls `build_member_signals(member, all_keywords)` without `use_gemini=True`. Therefore, **standard evaluation runs execute purely rule-based regex parsing and do not call the Gemini API**.
- **Asynchronous Enrichment Job (`POST /api/enrich/`)**:
  Gemini extraction is only invoked when `POST /api/enrich/?use_gemini=true` is triggered explicitly as a background job. Once cached under `cache/`, subsequent signal evaluations load the pre-cached Gemini signals.

---

## 7. Criterion Mapping (`backend/app/scoring/signal_mapping.py`)

Raw member signals are mapped to normalized numeric scores between **0 and 100** by [`map_signals_to_criteria`](file:///backend/app/scoring/signal_mapping.py#L3):

```python
def get_signal_val(sig_name: str, default=0):
    for sig in member_signals:
        if sig.get("name") == sig_name and sig.get("status") == "OK":
            return sig.get("value", default)
    return default
```

Only signals with status `OK` contribute to raw scores. Missing, unavailable, or failed signals return their default zero value:

| Criterion Name | Relevant Signal | Normalization Formula | Scale Cap |
| :--- | :--- | :--- | :--- |
| **Technical Skills** | `skills_matched` | `(matched_keywords_count / 5.0) * 100` | 5 matched keywords = 100 pts (capped at 100) |
| **Projects and Experience** | `projects_found` | `(len(projects) / 3.0) * 100` | 3 projects = 100 pts (capped at 100) |
| **GitHub Activity** | `github_commits` | `(commits / 500.0) * 100` | 500 commits = 100 pts (capped at 100) |
| **Achievements** | `achievements_found` | `(len(achievements) / 2.0) * 100` | 2 achievements = 100 pts (capped at 100) |
| **Portfolio** | `portfolio_valid` | `100.0 if portfolio_valid else 0.0` | Binary: Valid & reachable = 100 pts; else 0 |

---

## 8. Cross-Reference Index

- For API endpoints exposing these signals and runs, see [API Contract](file:///docs/api-contract.md).
- For scoring formulas, missing-data policies, and aggregation methods, see [Scoring Explained](file:///docs/scoring-explained.md).
- For network timeouts, external rate limits, and PDF limits, see [External Data Sources](file:///docs/data-sources.md).
