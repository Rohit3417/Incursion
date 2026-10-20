# Q&A: Scoring Engine, Fairness & Determinism

## Q: How does the scoring engine guarantee fairness across varying team sizes (solo vs. 6 members)?
A: Individual member scores are calculated independently using the exact same weighted criterion formula. Team scores are then aggregated using the configured method (Arithmetic Mean by default, or Highest Member for specialist setups). Solo teams and large teams (5+ members) receive explicit informational notes (`Solo team`, `Large team`) so judges and reviewers have immediate context.

## Q: How does the engine handle missing data without penalizing candidates unfairly?
A: Candidates are never given a silent zero for missing links unless explicitly configured. Organizers choose a Missing-Data Policy:
1. **Redistribute (Default):** Weights of missing criteria are proportionally redistributed across the candidate's available criteria.
2. **Neutral:** Assigns the average score of present criteria.
3. **Penalty:** Scores missing criteria as 0.
Every affected criterion is explicitly listed in the team's `missing_warnings` array for absolute transparency.

## Q: How is determinism guaranteed across repeated runs?
A: Determinism is enforced through three mechanisms:
1. **Canonical JSON Hashing:** Every run computes a SHA-256 `run_hash` from the dataset ID and config dictionary sorted by keys.
2. **Deterministic Sorting:** The ranking engine sorts by numeric scores descending and terminates tie-breaks strictly with `team_id` in ascending order.
3. **Reproducibility Verification:** The backend endpoint `POST /api/runs/{id}/verify` re-executes stored inputs to prove identical hash generation.