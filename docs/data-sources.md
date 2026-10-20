# External Data Sources, Safeguards & Limits

## 1. Resume PDFs (`PyMuPDF`)
* **Extraction:** Downloads public PDF links (10MB cap, 8s timeout) and extracts raw text via `PyMuPDF`.
* **Limits & Flags:** Scanned image-only PDFs are flagged `NO TEXT` (no OCR fabrication). Private Google Drive links returning HTML sign-in pages are flagged `UNAVAILABLE`.
* **Verification:** Every extracted skill, project, or achievement stores a character offset and verbatim text snippet from the PDF.

## 2. Optional Gemini Extraction (`gemini-2.5-flash`)
* **Deterministic Settings:** Invoked at `temperature: 0.0` using only the extracted resume text.
* **Anti-Hallucination Safeguard:** Gemini must return an exact verbatim `quote` alongside every extracted item. Deterministic Python code checks whether the normalized quote exists inside the raw resume text. If the quote is missing, the signal is downgraded to `UNCERTAIN`.
* **Role Boundary:** Gemini never computes scores, weights, or rankings.

## 3. GitHub API (`api.github.com`)
* **Signals Collected:** Public repository count, original (non-forked) count, primary languages, stargazers, last push date, and 12-month approximate activity.
* **Rate Limits & Resilience:** Authenticated via `GITHUB_TOKEN` (5,000 req/hr). On HTTP 403/429 rate limits or timeouts, the client halts retries, falls back to local disk cache (`cache/`), or flags `API_FAILED` without crashing the run.

## 4. Portfolio & LinkedIn URLs
* **Portfolio Websites:** Checked via `requests` + `BeautifulSoup` for reachability, `<title>`, and project/work section indicators.
* **LinkedIn Profiles:** Validated for URL syntax and duplicate detection only (never scraped due to anti-bot restrictions).