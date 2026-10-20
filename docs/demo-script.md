# 8-Step Live Demo Script (5 Minutes)

1. **The Problem (30s):** Show a messy hackathon registration sheet with variable team sizes (1 to 6 members), missing links, and unverified claims.
2. **Step 1 — Upload & Validate (45s):** Upload `samples/registrations_40.csv` on `/upload`. Highlight the automated Validation Report, duplicate team warnings, and grey `Missing Data` badges (never silent red zeros).
3. **Step 2 — Configure Strategy (45s):** Navigate to `/config`. Select the **Balanced Default** preset, inspect the 5 criteria weights totaling 100, and review the Missing-Data Policy (`redistribute`).
4. **Step 3 — Deterministic Evaluation (30s):** Click **Run Evaluation**. Point out the deterministic SHA-256 `Run Hash` at the top of `/results`.
5. **Step 4 — Explainable Breakdown & Drawer (45s):** Expand a team's row to show criterion contribution bars. Click **Inspect** to open the Team Detail Drawer showing top strengths, cutoff gap, eligibility rule checks, and member signals.
6. **Step 5 — Manual Review & Audit Trail (45s):** Open the `Needs review queue` tab. Pin a team to the shortlist with an audit reason; show the `PIN` badge and preserved `Auto Rank` beside `Final Rank`. Toggle **Blind Mode: ON** to demonstrate bias-free review.
7. **Step 6 — Live What-If Re-Ranking (30s):** Adjust the `GitHub Activity` and `Projects` sliders in the What-If Panel. Highlight the live `+4` rank delta arrows and `Entered Top X` badges.
8. **Step 7 — Auditable Export & Verification (30s):** Download the **Reproducible ZIP Bundle** (`results.csv`, `config.json`, `manifest.json`) and click **Verify Hash** on `/history` to prove 100% deterministic reproducibility.