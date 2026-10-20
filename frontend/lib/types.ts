export interface Member {
  name: string;
  email: string;
  github?: string | null;
  resume?: string | null;
  linkedin?: string | null;
  portfolio?: string | null;
}

export interface Team {
  team_id: string;
  team_name: string;
  members: Member[];
}

export interface ValidationReport {
  errors: string[];
  warnings: string[];
  duplicate_teams: Array<{ row: number; team: string }>;
  invalid_links_count: number;
  missing_links_count: number;
}

export interface UploadResponse {
  dataset_id: string;
  row_count: number;
  preview: Record<string, any>[];
  validation_report: ValidationReport;
}

export interface Criterion {
  name: string;
  weight: number;
  keywords?: string[];
}

export interface EligibilityRule {
  signal: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | 'contains';
  value: string | number;
  scope: 'any_member' | 'all_members' | 'team';
}

export interface ScoringConfig {
  criteria: Criterion[];
  eligibility_rules: EligibilityRule[];
  top_x: number;
  aggregation: 'mean' | 'highest_member' | 'weighted_mean';
  missing_policy: 'redistribute' | 'neutral' | 'penalty';
  tie_break: string[];
}

export interface ConfigRecord {
  id: string;
  name: string;
  is_preset?: boolean;
  config_json: ScoringConfig;
  created_at?: string;
}

export interface TeamResult {
  team_id: string;
  team_name: string;
  rank?: number | null;
  final_rank?: number | null;
  automated_rank?: number | null;
  team_score: number;
  status: string;
  automated_status?: string;
  override_action?: 'pin' | 'exclude' | 'waitlist' | null;
  override_reason?: string | null;
  criterion_breakdown?: Record<string, number>;
  failed_rules?: any[];
  missing_warnings?: string[];
  explanation?: string;
  explanation_details?: {
    criterion_shares?: Record<string, number>;
    top_two_strengths?: string[];
    weakest_criterion?: string | null;
    gap_to_cutoff?: number;
    failed_eligibility_rules?: any[];
    missing_warnings?: string[];
  };
  _member_criterion_values?: Record<string, Record<string, any>>;
  rank_delta?: number;
  old_rank?: number | null;
  new_rank?: number | null;
  entered_top_x?: boolean;
  left_top_x?: boolean;
}

export interface RunRecord {
  id: string;
  dataset_id: string;
  config_snapshot_json: ScoringConfig;
  run_hash: string;
  results_json: TeamResult[];
  created_at: string;
}

export interface RunSummary {
  id: string;
  dataset_id: string;
  run_hash: string;
  created_at: string;
}

export interface VerificationResult {
  status: string;
  run_id: string;
  matches: boolean;
  stored_run_hash: string;
  recomputed_run_hash: string;
  stored_output_hash: string;
  recomputed_output_hash: string;
}

export interface ConfigComparisonRow {
  team_id: string;
  team_name: string;
  rank_a: number | null;
  score_a: number;
  status_a: string;
  rank_b: number | null;
  score_b: number;
  status_b: string;
  rank_diff: number;
  score_diff: number;
  status_changed: boolean;
}