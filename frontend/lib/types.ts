/**
 * Shared TypeScript type definitions for the Incursion Track 3 frontend.
 *
 * Sources:
 *   - docs/api-contract.md  (M4, Day 2 Final)
 *   - docs/data-format.md   (M2)
 *   - docs/profile-contract.md (M2, Day 8–10, enrichment signals — types defined here
 *     for completeness but UNAVAILABLE/UNCERTAIN only appear post-enrichment)
 *
 * Reconcile with:
 *   - M1's backend/app/scoring/config_schema.py (configuration criteria, weights)
 *   - M4's docs/api-contract.md (dataset, run, override shapes)
 *   - M2's docs/profile-contract.md (enriched signal states, Days 8–10)
 */

// ---------------------------------------------------------------------------
// 1. Signal / Missing-data statuses
//    Full 5-state enum per design.md section 3 and api-contract.md section 4.
//    At the upload stage (Day 2–4), only OK | MISSING | INVALID are emitted.
//    UNAVAILABLE and UNCERTAIN are enrichment-stage statuses (Days 8–10).
// ---------------------------------------------------------------------------

export type FieldStatus = "OK" | "MISSING" | "INVALID" | "UNAVAILABLE" | "UNCERTAIN";

// ---------------------------------------------------------------------------
// 2. Member field — value + status tuple used for optional link fields.
//    Mirrors api-contract.md section 3.2 GET /datasets/{dataset_id}/teams.
// ---------------------------------------------------------------------------

export interface MemberField {
  value: string | null;
  status: FieldStatus;
}

// ---------------------------------------------------------------------------
// 3. Member — one person in a team.
//    name and email are required fields (always present as strings).
//    Optional link fields carry MemberField (value + status).
// ---------------------------------------------------------------------------

export interface Member {
  name: string;
  email: string;
  github: MemberField;
  resume: MemberField;
  linkedin: MemberField;
  portfolio: MemberField;
}

// ---------------------------------------------------------------------------
// 4. Team — one team with its members.
//    Matches both the upload preview shape and the full teams endpoint shape.
// ---------------------------------------------------------------------------

export interface Team {
  team_id: string;
  team_name: string;
  members: Member[];
}

// ---------------------------------------------------------------------------
// 5. DatasetTeamsResponse — GET /datasets/{dataset_id}/teams response.
//    Reconcile with M2's api/upload.py (Day 4).
// ---------------------------------------------------------------------------

export interface DatasetTeamsResponse {
  dataset_id: string;
  teams: Team[];
}

// ---------------------------------------------------------------------------
// 6. Upload endpoint types — POST /upload response.
//    Reconcile with M2's api/upload.py (Day 4) and M4's docs/api-contract.md.
// ---------------------------------------------------------------------------

/**
 * Preview row returned in the POST /upload response.
 * Only carries team_id, team_name, and member_count — NOT the full member list.
 * Full member data (with per-field statuses) comes from GET /datasets/{id}/teams.
 */
export interface UploadPreviewRow {
  team_id: string;
  team_name: string;
  member_count: number;
}

/**
 * Validation report embedded in the POST /upload response.
 * duplicate_teams and duplicate_members are arrays of team_id strings
 * (not counts) per api-contract.md section 3.2.
 */
export interface ValidationReport {
  errors_count: number;
  warnings_count: number;
  duplicate_teams: string[];
  duplicate_members: string[];
  /** field_name → count of members with that field missing */
  missing_fields_summary: Record<string, number>;
}

/**
 * Full POST /upload 201 Created response shape.
 * Reconcile with M2's api/upload.py (Day 4).
 */
export interface UploadResponse {
  dataset_id: string;
  filename: string;
  content_hash: string;
  total_teams: number;
  total_members: number;
  validation_report: ValidationReport;
  /** First ~20 rows for immediate preview — no per-field statuses yet. */
  preview: UploadPreviewRow[];
}

// ---------------------------------------------------------------------------
// 7. Eligibility — used in run results (Days 6+)
//    Reconcile with M1's backend/app/scoring/config_schema.py.
// ---------------------------------------------------------------------------

export type EligibilityStatus = "Eligible" | "Ineligible" | "Needs review";

export interface EligibilityResult {
  status: EligibilityStatus;
  failed_rules: string[];
}

// ---------------------------------------------------------------------------
// 8. Final shortlist statuses — used in run results (Days 6+)
//    4-state enum per design.md section 3.
// ---------------------------------------------------------------------------

export type ShortlistStatus =
  | "Shortlisted"
  | "Not shortlisted"
  | "Ineligible"
  | "Needs review"
  | "Shortlisted (Pinned)"; // override variant from api-contract.md section 3.4

// ---------------------------------------------------------------------------
// 9. Run result types — GET /runs/{id} response (Days 6+)
//    Reconcile with M4's api/runs.py (Day 6).
// ---------------------------------------------------------------------------

export interface CriterionBreakdown {
  score: number;
  weight: number;
  weighted_points: number;
}

export interface TeamResult {
  rank: number;
  team_id: string;
  team_name: string;
  team_score: number;
  status: ShortlistStatus;
  eligibility: EligibilityResult;
  criterion_breakdown: Record<string, CriterionBreakdown>;
  strengths: string[];
  weakest_criterion: string;
  explanation: string;
  missing_warnings: string[];
  member_criterion_values: Record<string, Record<string, number>>;
}

export interface RunResponse {
  run_id: string;
  dataset_id: string;
  run_hash: string;
  created_at: string;
  config_snapshot: unknown; // shape confirmed Day 6; typed unknown until M4's runs.py lands
  results: TeamResult[];
}

// ---------------------------------------------------------------------------
// 10. Override types — POST/GET /runs/{id}/overrides (Day 9+)
//     Reconcile with M4's api/overrides.py (Day 9).
// ---------------------------------------------------------------------------

export type OverrideAction = "pin" | "exclude" | "waitlist";

export interface Override {
  id: string;
  run_id: string;
  team_id: string;
  action: OverrideAction;
  reason: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// 11. Configuration types — POST/GET /configs (Day 3+)
//     Reconcile with M1's backend/app/scoring/config_schema.py (Day 1).
// ---------------------------------------------------------------------------

export type RuleScope = "any_member" | "all_members" | "team";
export type AggregationMethod = "mean" | "weighted_mean" | "at_least_one";
export type MissingPolicy = "redistribute" | "neutral" | "penalty";

export interface Criterion {
  name: string;
  weight: number; // 0–100, must sum to 100 across all criteria
  keywords: string[];
}

/**
 * UI-only criterion item with stable React rendering key.
 * Not sent to the backend.
 */
export interface CriterionWithId extends Criterion {
  id: string;
}

export interface EligibilityRule {
  signal: string;
  operator: string;
  value: number | string | boolean;
  scope: RuleScope;
}

export interface ScoringConfigJson {
  criteria: Criterion[];
  eligibility_rules: EligibilityRule[];
  top_x: number;
  aggregation: AggregationMethod;
  missing_policy: MissingPolicy;
  tie_break: string[]; // must terminate with "team_id"
}

export interface ScoringConfiguration {
  id?: string;
  name: string;
  is_preset: boolean;
  config_json: ScoringConfigJson;
  created_at?: string;
}

// ---------------------------------------------------------------------------
// 12. Saved Configuration & API contract types (Day 5+)
//     Matches docs/api-contract.md section 3.3 and backend/app/db/schemas.py.
// ---------------------------------------------------------------------------

export interface ConfigurationListItem {
  id: string;
  name: string;
  is_preset: boolean;
  created_at: string;
}

export interface ConfigurationRecord {
  id: string;
  name: string;
  is_preset: boolean;
  config_json: ScoringConfigJson;
  created_at: string;
}

export interface ConfigurationCreate {
  name: string;
  is_preset?: boolean;
  config_json: ScoringConfigJson;
}

export interface ConfigurationUpdate {
  name?: string;
  config_json?: ScoringConfigJson;
}

export interface ApiValidationErrorDetail {
  loc: (string | number)[];
  msg: string;
  type: string;
}

