# What-If Live Demo Scenario

## Objective
Demonstrate how changing from a **Skills-Heavy** strategy to a **Projects-Heavy** strategy on `samples/registrations_40.csv` causes at least 3 teams to enter or leave the Top-10 shortlist in real time without altering the stored baseline run.

## Steps During Live Demo
1. **Baseline Run (`Skills-Heavy`):**
   * `Technical Skills = 55`, `Projects and Experience = 15`, `GitHub Activity = 10`, `Achievements = 10`, `Portfolio = 10`.
   * Teams with keyword-dense resumes rank inside the Top 10.
2. **Live What-If Shift (`Projects-Heavy`):**
   * In the What-If Panel on `/results`, drag `Technical Skills` down to `10`, `Projects and Experience` up to `40`, and `GitHub Activity` up to `30`.
3. **Observed Outcome:**
   * Teams with strong open-source commit activity and verified portfolio projects jump +4 to +8 ranks and display the green **Entered Top X** badge.
   * Keyword-only teams drop below Rank #10 and display the red **Left Top X** badge.