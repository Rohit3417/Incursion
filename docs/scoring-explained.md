# How the Scoring & Shortlisting Engine Works

## 1. Member Scoring Formula
Every candidate is evaluated across configurable criteria (defaulting to Technical Skills, Projects & Experience, GitHub Activity, Achievements, and Portfolio)[cite: 4].
* Raw profile signals are normalized onto a **0 to 100** scale using config-defined caps[cite: 4, 6].
* A member's total score is the weighted sum of their criterion scores[cite: 4]:
  $$\text{Member Score} = \sum_{i=1}^{n} \left(\frac{\text{Criterion Score}_i}{100} \times \text{Weight}_i\right)$$
  where $\sum \text{Weight}_i = 100$[cite: 4].

## 2. Missing-Data Policy
Never penalize a candidate with a silent zero when a link is unreachable unless explicitly configured[cite: 4, 6]. Organizers choose one of three policies[cite: 5]:
* **Redistribute (Default):** Missing criteria have their weights proportionally redistributed across the member's available criteria[cite: 5].
* **Neutral:** Missing criteria are assigned the average score of the member's present criteria.
* **Penalty:** Missing criteria are scored as `0`[cite: 5].
Every affected criterion is explicitly listed in the team's `missing_warnings` array[cite: 5].

## 3. Team Aggregation
Individual member scores are combined into a single `team_score` using the configured aggregation rule[cite: 4, 5]:
* **Mean (Default):** Arithmetic average of all members in the team[cite: 4, 5].
* **Highest Member:** Uses the top-scoring member's score to evaluate specialist-led teams[cite: 5].
Solo teams and large teams (5+ members) receive informational notes for reviewer context[cite: 5].

## 4. Hard Eligibility Rules
Eligibility is evaluated **separately** from weighted scores[cite: 4, 9]:
* If a team fails a boolean rule (e.g., minimum team size or mandatory field), its status becomes **Ineligible** regardless of its numeric score[cite: 5].
* If a rule cannot be verified because a signal is `MISSING` or `UNCERTAIN`, the team is flagged as **Needs review**[cite: 5].

## 5. Deterministic Ranking & Tie-Breaking
Eligible teams are sorted by `team_score` descending and cut at `top_x` (**Shortlisted** vs. **Not shortlisted**)[cite: 6]. Ties are resolved using the `tie_break` chain defined in the configuration, which always terminates with `team_id` in ascending order so identical inputs always produce the exact same ranking[cite: 1, 6].