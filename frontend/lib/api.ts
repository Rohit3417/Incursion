import {
  UploadResponse,
  ConfigRecord,
  ScoringConfig,
  RunRecord,
  RunSummary,
  VerificationResult,
  ConfigComparisonRow,
  TeamResult,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

/**
 * Upload a CSV or JSON dataset and receive validation reports + preview
 */
export async function uploadDataset(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/upload/`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let message = 'Upload failed';
    try {
      const err = await response.json();
      message = err.detail || message;
    } catch {
      message = `Server returned ${response.status}: ${response.statusText}`;
    }
    throw new Error(message);
  }
  return response.json();
}

/**
 * Fetch all saved strategy configurations & presets
 */
export async function getConfigs(): Promise<{ status: string; data: ConfigRecord[] }> {
  const response = await fetch(`${API_BASE}/configs/`);
  if (!response.ok) throw new Error('Failed to fetch configurations');
  return response.json();
}

/**
 * Save a new configuration
 */
export async function saveConfig(
  name: string,
  config: ScoringConfig,
  isPreset: boolean = false
): Promise<{ status: string; data: ConfigRecord }> {
  const response = await fetch(
    `${API_BASE}/configs/?name=${encodeURIComponent(name)}&is_preset=${isPreset}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    }
  );

  if (!response.ok) {
    let message = 'Failed to save configuration';
    try {
      const err = await response.json();
      if (err.detail?.errors && Array.isArray(err.detail.errors)) {
        message = err.detail.errors.join('; ');
      } else if (typeof err.detail === 'string') {
        message = err.detail;
      }
    } catch {}
    throw new Error(message);
  }
  return response.json();
}

/**
 * Run evaluation for a given dataset and configuration
 */
export async function runEvaluation(
  datasetId: string,
  configId: string
): Promise<{ status: string; run_id: string }> {
  const response = await fetch(
    `${API_BASE}/runs/?dataset_id=${encodeURIComponent(datasetId)}&config_id=${encodeURIComponent(configId)}`,
    {
      method: 'POST',
    }
  );

  if (!response.ok) {
    let message = 'Evaluation failed';
    try {
      const err = await response.json();
      message = err.detail || message;
    } catch {}
    throw new Error(message);
  }
  return response.json();
}

/**
 * Get details of a single evaluation run
 */
export async function getRun(runId: string): Promise<{ status: string; data: RunRecord }> {
  const response = await fetch(`${API_BASE}/runs/${runId}`);
  if (!response.ok) throw new Error(`Failed to fetch run data for ${runId}`);
  return response.json();
}

/**
 * Get final team order with manual overrides applied
 */
export async function getFinalRunOrder(
  runId: string
): Promise<{ status: string; run_id: string; data: TeamResult[] }> {
  const response = await fetch(`${API_BASE}/runs/${runId}/final`);
  if (!response.ok) throw new Error('Failed to fetch final run order');
  return response.json();
}

/**
 * Post a manual override (pin, exclude, waitlist) with required audit reason
 */
export async function postOverride(
  runId: string,
  teamId: string,
  action: 'pin' | 'exclude' | 'waitlist',
  reason: string
): Promise<{ status: string; data: any }> {
  const response = await fetch(`${API_BASE}/runs/${runId}/overrides`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ team_id: teamId, action, reason }),
  });

  if (!response.ok) {
    let message = 'Failed to apply override';
    try {
      const err = await response.json();
      message = err.detail || message;
    } catch {}
    throw new Error(message);
  }
  return response.json();
}

/**
 * Live recompute ranking with What-If adjustments without mutating the database
 */
export async function recomputeLiveRank(
  runId: string,
  config: ScoringConfig,
  includeSensitivity: boolean = false
): Promise<{ status: string; data: TeamResult[]; sensitivity?: any[] }> {
  const response = await fetch(`${API_BASE}/rank/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      run_id: runId,
      config,
      include_sensitivity: includeSensitivity,
    }),
  });

  if (!response.ok) {
    let message = 'Live re-ranking failed';
    try {
      const err = await response.json();
      message = err.detail || message;
    } catch {}
    throw new Error(message);
  }
  return response.json();
}

/**
 * List all historical evaluation runs
 */
export async function listRuns(): Promise<{ status: string; data: RunSummary[] }> {
  const response = await fetch(`${API_BASE}/runs/`);
  if (!response.ok) throw new Error('Failed to fetch run history');
  return response.json();
}

/**
 * Verify cryptographic reproducibility of a run hash
 */
export async function verifyRunReproducibility(runId: string): Promise<VerificationResult> {
  const response = await fetch(`${API_BASE}/runs/${runId}/verify`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Verification request failed');
  return response.json();
}

/**
 * Compare two configurations side-by-side
 */
export async function compareConfigurations(
  runId: string,
  configA: ScoringConfig,
  configB: ScoringConfig,
  teamAId?: string,
  teamBId?: string
): Promise<{
  status: string;
  run_id: string;
  comparison: ConfigComparisonRow[];
  pairwise?: any;
}> {
  const response = await fetch(`${API_BASE}/compare/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      run_id: runId,
      config_a: configA,
      config_b: configB,
      team_a_id: teamAId,
      team_b_id: teamBId,
    }),
  });

  if (!response.ok) {
    let message = 'Comparison failed';
    try {
      const err = await response.json();
      message = err.detail || message;
    } catch {}
    throw new Error(message);
  }
  return response.json();
}

/**
 * Helper to build the download URL for CSV/JSON/ZIP exports
 */
export function getExportDownloadUrl(
  runId: string,
  type: 'shortlist' | 'rejected' | 'waitlist' | 'breakdown',
  format: 'csv' | 'json' | 'zip',
  blind: boolean
): string {
  return `${API_BASE}/runs/${runId}/export?type=${type}&format=${format}&blind=${blind}`;
}