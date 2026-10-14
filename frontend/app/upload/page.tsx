"use client";

/**
 * /upload — Day 2 (file picker + preview) + Day 4 (full validation UI)
 *
 * prd.md section 2 /upload:
 *   Day 2: File picker, upload progress indicator, preview table of first 20 rows.
 *   Day 4: SummaryCards (metric overview), ValidationPanel (errors/warnings/
 *           duplicates/missing-fields), TeamTable (full team list with per-member
 *           field statuses), loading state, error+retry state.
 *
 * Architecture notes:
 *   - uploadDataset()    → TEMPORARY MOCK (M2, Day 4 stub in backend)
 *   - getDatasetTeams()  → TEMPORARY MOCK (M2, Day 4 stub in backend)
 *   - Both remain in lib/api.ts; swapping to real endpoints requires ZERO
 *     component changes — only api.ts changes.
 *   - Page fetches DatasetTeamsResponse at the page level and passes Team[]
 *     to TeamTable. DataPreview also calls getDatasetTeams() internally for
 *     its own expand functionality — this is intentional so the two components
 *     remain independently composable.
 *   - setDatasetId persists dataset_id into AppStateContext for /config → /runs.
 *
 * Wires:
 *   UploadBox → handleUploadComplete → uploadResult state
 *   SummaryCards(uploadResult)
 *   ValidationPanel(uploadResult.validation_report)
 *   DataPreview(uploadResult)        ← Day 2, kept intact
 *   TeamTable(teamsResult.teams)     ← Day 4
 */

import { useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadBox } from "@/components/upload/UploadBox";
import { DataPreview } from "@/components/upload/DataPreview";
import { SummaryCards } from "@/components/upload/SummaryCards";
import { ValidationPanel } from "@/components/upload/ValidationPanel";
import { TeamTable } from "@/components/upload/TeamTable";
import { useAppState } from "@/lib/app-state-context";
import { getDatasetTeams } from "@/lib/api";
import type { UploadResponse, DatasetTeamsResponse } from "@/lib/types";

export default function UploadPage() {
  const { setDatasetId } = useAppState();

  // Upload result from POST /upload (TEMPORARY MOCK)
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Teams result from GET /datasets/{id}/teams (TEMPORARY MOCK)
  const [teamsResult, setTeamsResult] = useState<DatasetTeamsResponse | null>(null);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [teamsError, setTeamsError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Fetch teams — extracted so the "Retry" button can call it too
  // ---------------------------------------------------------------------------

  const fetchTeams = useCallback(async (datasetId: string) => {
    setTeamsLoading(true);
    setTeamsError(null);
    setTeamsResult(null);
    try {
      const result = await getDatasetTeams(datasetId);
      setTeamsResult(result);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load team details. Please try again.";
      setTeamsError(message);
    } finally {
      setTeamsLoading(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Upload handlers
  // ---------------------------------------------------------------------------

  function handleUploadComplete(response: UploadResponse) {
    // Persist dataset_id into shared AppStateContext (design.md section 5,
    // prd.md section 4 — carried into /config and used by POST /runs)
    setDatasetId(response.dataset_id);
    setUploadResult(response);
    setUploadError(null);

    // Immediately begin loading full team detail
    void fetchTeams(response.dataset_id);
  }

  function handleUploadError(message: string) {
    setUploadError(message);
    setUploadResult(null);
    setTeamsResult(null);
    setTeamsError(null);
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
      <div className="flex flex-col gap-6">

        {/* ---------------------------------------------------------------- */}
        {/* Upload card                                                        */}
        {/* ---------------------------------------------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Registration File</CardTitle>
            <CardDescription>
              Accepts CSV (wide format, up to 6 members per team) or JSON.
              The real{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">POST /upload</code>{" "}
              API lands on Day 4 (M2). Until then, all results use mock data matching
              the exact contract shape.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UploadBox
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
            />

            {/* Server-side upload error */}
            {uploadError && (
              <p role="alert" className="mt-3 text-sm text-red-600">
                {uploadError}
              </p>
            )}
          </CardContent>
        </Card>

        {/* ---------------------------------------------------------------- */}
        {/* Post-upload UI — only shown after a successful upload              */}
        {/* ---------------------------------------------------------------- */}
        {uploadResult && (
          <>
            {/* Summary line (retained from Day 2) */}
            <div className="text-sm text-muted-foreground px-1">
              <span className="font-medium text-foreground">
                {uploadResult.total_teams} teams
              </span>{" "}
              ·{" "}
              <span className="font-medium text-foreground">
                {uploadResult.total_members} members
              </span>{" "}
              ·{" "}
              {uploadResult.validation_report.errors_count > 0 ? (
                <span className="text-red-600 font-medium">
                  {uploadResult.validation_report.errors_count} error
                  {uploadResult.validation_report.errors_count !== 1 ? "s" : ""}
                </span>
              ) : (
                <span className="text-green-700">0 errors</span>
              )}{" "}
              ·{" "}
              {uploadResult.validation_report.warnings_count > 0 ? (
                <span className="text-yellow-700 font-medium">
                  {uploadResult.validation_report.warnings_count} warning
                  {uploadResult.validation_report.warnings_count !== 1 ? "s" : ""}
                </span>
              ) : (
                <span className="text-muted-foreground">0 warnings</span>
              )}
              {" · "}
              <span className="font-mono text-xs text-muted-foreground">
                dataset_id: {uploadResult.dataset_id}
              </span>
            </div>

            {/* ------------------------------------------------------------ */}
            {/* Day 4 — SummaryCards                                           */}
            {/* ------------------------------------------------------------ */}
            <SummaryCards uploadResponse={uploadResult} />

            {/* ------------------------------------------------------------ */}
            {/* Day 4 — ValidationPanel                                        */}
            {/* ------------------------------------------------------------ */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Validation Report</CardTitle>
                <CardDescription>
                  Errors, warnings, duplicate entries, and missing optional fields from{" "}
                  <span
                    className="font-medium max-w-xs truncate inline-block align-bottom"
                    title={uploadResult.filename}
                  >
                    {uploadResult.filename}
                  </span>
                  .
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ValidationPanel validationReport={uploadResult.validation_report} />
              </CardContent>
            </Card>

            {/* ------------------------------------------------------------ */}
            {/* Day 2 — DataPreview (retained; uses internal getDatasetTeams) */}
            {/* ------------------------------------------------------------ */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Team Preview</CardTitle>
                <CardDescription>
                  First {uploadResult.preview.length} teams from{" "}
                  <span
                    className="font-medium max-w-xs truncate inline-block align-bottom"
                    title={uploadResult.filename}
                  >
                    {uploadResult.filename}
                  </span>
                  . Click &ldquo;Show members&rdquo; to see per-field statuses.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataPreview
                  datasetId={uploadResult.dataset_id}
                  previewRows={uploadResult.preview}
                  validationReport={uploadResult.validation_report}
                />
              </CardContent>
            </Card>

            {/* ------------------------------------------------------------ */}
            {/* Day 4 — Full TeamTable with loading / error / retry           */}
            {/* ------------------------------------------------------------ */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">All Teams</CardTitle>
                <CardDescription>
                  Complete team list with per-member field statuses. Expand a row to
                  see individual member detail.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {teamsLoading && (
                  <div
                    role="status"
                    aria-label="Loading team data"
                    className="py-6 flex flex-col items-center gap-2 text-sm text-muted-foreground"
                  >
                    <span className="animate-pulse">Loading team data…</span>
                  </div>
                )}

                {teamsError && !teamsLoading && (
                  <div
                    role="alert"
                    className="rounded-md border border-red-200 bg-red-50 px-4 py-3 flex flex-col gap-2"
                  >
                    <p className="text-sm text-red-700">{teamsError}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="self-start"
                      onClick={() => void fetchTeams(uploadResult.dataset_id)}
                    >
                      Retry
                    </Button>
                  </div>
                )}

                {teamsResult && !teamsLoading && (
                  <TeamTable teams={teamsResult.teams} />
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
