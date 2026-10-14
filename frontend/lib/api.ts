/**
 * Backend API client — all HTTP communication goes through this module.
 *
 * design.md section 4: A single fetcher<T> base wrapper centralises headers,
 * base URL, JSON parsing, and error handling. Components/pages must not call
 * fetch() directly.
 *
 * Each function that is not yet backed by a real endpoint is marked with the
 * exact grep-able prefix: TEMPORARY MOCK — replace when <owner>'s <file> is available.
 */

import type {
  UploadResponse,
  DatasetTeamsResponse,
  ConfigurationListItem,
  ConfigurationRecord,
  ConfigurationCreate,
  ConfigurationUpdate,
  ApiValidationErrorDetail,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Base URL
// ---------------------------------------------------------------------------

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

// ---------------------------------------------------------------------------
// Custom ApiError with structured 422 validation details
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  status: number;
  validationErrors?: ApiValidationErrorDetail[];

  constructor(
    message: string,
    status: number = 400,
    validationErrors?: ApiValidationErrorDetail[]
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.validationErrors = validationErrors;
  }
}

// ---------------------------------------------------------------------------
// Base fetch wrapper
// ---------------------------------------------------------------------------

/**
 * Centralised fetch helper.
 * - Automatically sets Content-Type for JSON bodies.
 * - Throws a descriptive ApiError for non-2xx responses.
 * - Never silently substitutes mock data when a real API call fails.
 */
async function fetcher<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let message = `API error ${response.status} ${response.statusText}`;
    let validationErrors: ApiValidationErrorDetail[] | undefined;
    try {
      const body = (await response.json()) as {
        detail?: string | ApiValidationErrorDetail[];
        message?: string;
      };
      if (Array.isArray(body?.detail)) {
        validationErrors = body.detail;
        message = body.detail.map((e) => e.msg).join("; ");
      } else if (typeof body?.detail === "string") {
        message = body.detail;
      } else if (body?.message) {
        message = body.message;
      }
    } catch {
      // response body not JSON — keep the status-based message
    }
    throw new ApiError(message, response.status, validationErrors);
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Ingest endpoints (M2, Day 4)
// ---------------------------------------------------------------------------

/**
 * POST /upload
 *
 * TEMPORARY MOCK — replace when M2's api/upload.py is available (Day 4).
 *
 * Accepts a File object and returns the full UploadResponse including
 * dataset_id, validation_report, and preview rows. The mock simulates a
 * realistic network delay so the progress bar in UploadBox is exercised.
 */
export async function uploadDataset(file: File): Promise<UploadResponse> {
  // TEMPORARY MOCK — replace when M2's api/upload.py is available (Day 4).
  const { mockUploadResponse } = await import("./mocks/uploadResponse");

  // Simulate network + server processing time (1.2 s)
  await new Promise((resolve) => setTimeout(resolve, 1200));

  // When the real endpoint is live, replace the body above with:
  //   const formData = new FormData();
  //   formData.append("file", file);
  //   return fetcher<UploadResponse>("/upload", { method: "POST", body: formData });
  void file; // parameter is accepted now so callers don't need to change signature
  return { ...mockUploadResponse, filename: file.name };
}

/**
 * GET /datasets/{dataset_id}/teams
 *
 * TEMPORARY MOCK — replace when M2's api/upload.py (GET /datasets/{id}/teams) is available (Day 4).
 *
 * Returns the full normalized team list with per-member field statuses.
 */
export async function getDatasetTeams(datasetId: string): Promise<DatasetTeamsResponse> {
  // TEMPORARY MOCK — replace when M2's api/upload.py (GET /datasets/{id}/teams) is available (Day 4).
  const { mockDatasetTeams } = await import("./mocks/datasetTeams");

  // Simulate network round-trip (600 ms)
  await new Promise((resolve) => setTimeout(resolve, 600));

  // When the real endpoint is live, replace the body above with:
  //   return fetcher<DatasetTeamsResponse>(`/datasets/${datasetId}/teams`);
  void datasetId; // parameter accepted so callers don't need to change signature
  return mockDatasetTeams;
}

// ---------------------------------------------------------------------------
// Configuration endpoints (M4, Day 5)
// ---------------------------------------------------------------------------

/**
 * GET /configs
 *
 * TEMPORARY MOCK — replace when M4's api/configs.py (GET /configs) is available (Day 5).
 *
 * Returns list of all saved configurations and system presets.
 */
export async function listConfigs(): Promise<ConfigurationListItem[]> {
  // TEMPORARY MOCK — replace when M4's api/configs.py (GET /configs) is available (Day 5).
  const { mockConfigurationList } = await import("./mocks/configs");

  // Simulate network round-trip (300 ms)
  await new Promise((resolve) => setTimeout(resolve, 300));

  // When the real endpoint is live, replace the body above with:
  //   return fetcher<ConfigurationListItem[]>("/configs");
  return mockConfigurationList;
}

/**
 * GET /configs/{config_id}
 *
 * TEMPORARY MOCK — replace when M4's api/configs.py (GET /configs/{id}) is available (Day 5).
 *
 * Returns full configuration record by ID.
 */
export async function getConfig(configId: string): Promise<ConfigurationRecord> {
  // TEMPORARY MOCK — replace when M4's api/configs.py (GET /configs/{id}) is available (Day 5).
  const { mockConfigurationRecords } = await import("./mocks/configs");

  // Simulate network round-trip (300 ms)
  await new Promise((resolve) => setTimeout(resolve, 300));

  const found = mockConfigurationRecords.find((c) => c.id === configId);
  if (!found) {
    throw new ApiError(`Configuration not found: ${configId}`, 404);
  }

  // When the real endpoint is live, replace the body above with:
  //   return fetcher<ConfigurationRecord>(`/configs/${configId}`);
  return found;
}

/**
 * POST /configs
 *
 * TEMPORARY MOCK — replace when M4's api/configs.py (POST /configs) is available (Day 5).
 *
 * Creates and persists a new scoring configuration. Validates payload before saving
 * and returns structured 422 errors if invalid.
 */
export async function createConfig(
  payload: ConfigurationCreate
): Promise<ConfigurationRecord> {
  // Simulate network round-trip (500 ms)
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Simulate server-side validation rules (config_schema.py & config_validate)
  const validationErrors: ApiValidationErrorDetail[] = [];

  if (!payload.name || payload.name.trim() === "") {
    validationErrors.push({
      loc: ["body", "name"],
      msg: "Configuration name cannot be empty",
      type: "value_error",
    });
  }

  if (!payload.config_json?.criteria || payload.config_json.criteria.length === 0) {
    validationErrors.push({
      loc: ["body", "config_json", "criteria"],
      msg: "At least one criterion is required",
      type: "value_error",
    });
  } else {
    payload.config_json.criteria.forEach((criterion, idx) => {
      if (!criterion.name || criterion.name.trim() === "") {
        validationErrors.push({
          loc: ["body", "config_json", "criteria", idx, "name"],
          msg: `Criterion ${idx + 1} name cannot be empty`,
          type: "value_error",
        });
      }
    });

    const totalWeight = payload.config_json.criteria.reduce(
      (sum, c) => sum + (c.weight ?? 0),
      0
    );
    if (totalWeight !== 100) {
      validationErrors.push({
        loc: ["body", "config_json", "criteria"],
        msg: `Weights must sum to 100 (got ${totalWeight})`,
        type: "value_error",
      });
    }
  }

  if (payload.config_json?.top_x == null || payload.config_json.top_x < 1) {
    validationErrors.push({
      loc: ["body", "config_json", "top_x"],
      msg: "top_x must be greater than or equal to 1",
      type: "value_error",
    });
  }

  if (validationErrors.length > 0) {
    throw new ApiError(
      validationErrors.map((e) => e.msg).join("; "),
      422,
      validationErrors
    );
  }

  // When the real endpoint is live, replace the simulated return with:
  //   return fetcher<ConfigurationRecord>("/configs", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify(payload),
  //   });
  const newRecord: ConfigurationRecord = {
    id: crypto.randomUUID(),
    name: payload.name.trim(),
    is_preset: Boolean(payload.is_preset),
    config_json: payload.config_json,
    created_at: new Date().toISOString(),
  };

  return newRecord;
}

/**
 * PUT /configs/{config_id}
 *
 * TEMPORARY MOCK — replace when M4's api/configs.py (PUT /configs/{id}) is available (Day 5).
 *
 * Updates an existing custom configuration. Presets are immutable (returns 400).
 */
export async function updateConfig(
  configId: string,
  payload: ConfigurationUpdate
): Promise<ConfigurationRecord> {
  // TEMPORARY MOCK — replace when M4's api/configs.py (PUT /configs/{id}) is available (Day 5).
  const { mockConfigurationRecords } = await import("./mocks/configs");

  // Simulate network round-trip (500 ms)
  await new Promise((resolve) => setTimeout(resolve, 500));

  const existing = mockConfigurationRecords.find((c) => c.id === configId);
  if (!existing) {
    throw new ApiError(`Configuration not found: ${configId}`, 404);
  }

  if (existing.is_preset) {
    throw new ApiError("Cannot modify system presets (is_preset == true)", 400);
  }

  // When the real endpoint is live, replace the return with:
  //   return fetcher<ConfigurationRecord>(`/configs/${configId}`, {
  //     method: "PUT",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify(payload),
  //   });
  return {
    ...existing,
    name: payload.name ?? existing.name,
    config_json: payload.config_json ?? existing.config_json,
  };
}

// ---------------------------------------------------------------------------
// Future endpoints — stubs to be implemented in later days
// ---------------------------------------------------------------------------

// Day 6+: createRun, getRun, listRuns — M4 api/runs.py
// Day 8+: rerank — M1 rank.py
// Day 9+: listOverrides, createOverride — M4 api/overrides.py
// Day 11+: compareConfigs — M1 api/compare.py
// Day 11+: exportRun — M4 api/export.py

// Export fetcher for any future ad-hoc use (e.g. hooks)
export { fetcher };
