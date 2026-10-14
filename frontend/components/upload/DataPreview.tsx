"use client";

/**
 * DataPreview — upload result preview table.
 *
 * Day 2 scope (prd.md section 2 /upload Day 2):
 *   - Preview table of the first 20 rows from the POST /upload response
 *     (team_id, team_name, member_count — no per-field statuses at this stage)
 *   - After preview rows load, calls GET /datasets/{id}/teams to fetch full
 *     member detail with per-field StatusBadges
 *   - Empty state, loading state, and truncation with title attribute
 *
 * Day 4+ features NOT included here:
 *   - Full ValidationPanel (errors/warnings split view)
 *   - SummaryCards with icons
 *   - Duplicate team visual flagging beyond the warning count in the summary
 *
 * Accessibility:
 *   - Expandable member rows use <button aria-expanded>
 *   - Long team names truncate via CSS + title attribute
 *   - Tables use proper <th scope="col">
 */

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { getDatasetTeams } from "@/lib/api";
import type {
  UploadPreviewRow,
  ValidationReport,
  Team,
  Member,
  FieldStatus,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Sub-component: member detail row (expandable per team)
// ---------------------------------------------------------------------------

interface MemberRowProps {
  member: Member;
  index: number;
}

function MemberDetailRow({ member, index }: MemberRowProps) {
  const optionalFields: { label: string; key: keyof Pick<Member, "github" | "resume" | "linkedin" | "portfolio"> }[] = [
    { label: "GitHub", key: "github" },
    { label: "Resume", key: "resume" },
    { label: "LinkedIn", key: "linkedin" },
    { label: "Portfolio", key: "portfolio" },
  ];

  return (
    <div className="pl-4 py-2 border-l-2 border-muted ml-2">
      <p className="text-xs font-medium text-muted-foreground mb-1">
        Member {index + 1}
        {member.name ? (
          <>
            {" — "}
            <span
              className="text-foreground max-w-[200px] truncate inline-block align-bottom"
              title={member.name}
            >
              {member.name}
            </span>
          </>
        ) : (
          <span className="text-yellow-600 ml-1">(no name — flagged)</span>
        )}
        {" · "}
        <span
          className="text-xs text-muted-foreground max-w-[200px] truncate inline-block align-bottom"
          title={member.email}
        >
          {member.email}
        </span>
      </p>
      <div className="flex flex-wrap gap-2">
        {optionalFields.map(({ label, key }) => {
          const field = member[key];
          return (
            <span key={key} className="flex items-center gap-1 text-xs">
              <span className="text-muted-foreground">{label}:</span>
              {field.status === "OK" && field.value ? (
                <span
                  className="max-w-[160px] truncate inline-block align-bottom text-xs text-foreground"
                  title={field.value}
                >
                  <StatusBadge status={field.status as FieldStatus} size="sm" />
                </span>
              ) : (
                <StatusBadge status={field.status as FieldStatus} size="sm" />
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: expandable team row
// ---------------------------------------------------------------------------

interface TeamRowProps {
  previewRow: UploadPreviewRow;
  teamDetail: Team | null;
  isLoadingDetail: boolean;
}

function TeamRow({ previewRow, teamDetail, isLoadingDetail }: TeamRowProps) {
  const [expanded, setExpanded] = useState(false);
  const hasDetail = teamDetail !== null;

  return (
    <>
      <TableRow>
        <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
          {previewRow.team_id}
        </TableCell>
        <TableCell>
          <span
            className="max-w-[220px] truncate inline-block align-bottom"
            title={previewRow.team_name}
          >
            {previewRow.team_name}
          </span>
        </TableCell>
        <TableCell className="text-right tabular-nums">
          {previewRow.member_count}
        </TableCell>
        <TableCell>
          {isLoadingDetail ? (
            <span className="text-xs text-muted-foreground animate-pulse">Loading…</span>
          ) : hasDetail ? (
            <button
              type="button"
              aria-expanded={expanded}
              aria-label={`${expanded ? "Collapse" : "Expand"} member details for ${previewRow.team_name}`}
              onClick={() => setExpanded((v) => !v)}
              className="text-xs text-primary underline underline-offset-2 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              {expanded ? "Collapse" : "Show members"}
            </button>
          ) : null}
        </TableCell>
      </TableRow>

      {expanded && hasDetail && (
        <TableRow>
          <TableCell colSpan={4} className="bg-muted/30 py-1">
            <div className="flex flex-col gap-2">
              {teamDetail.members.map((member, i) => (
                <MemberDetailRow key={i} member={member} index={i} />
              ))}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main DataPreview component
// ---------------------------------------------------------------------------

interface DataPreviewProps {
  datasetId: string;
  previewRows: UploadPreviewRow[];
  validationReport: ValidationReport;
}

export function DataPreview({
  datasetId,
  previewRows,
  validationReport,
}: DataPreviewProps) {
  const [teamDetails, setTeamDetails] = useState<Map<string, Team>>(new Map());
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function fetchTeams() {
      try {
        const response = await getDatasetTeams(datasetId);
        if (!ignore) {
          const map = new Map<string, Team>();
          for (const team of response.teams) {
            map.set(team.team_id, team);
          }
          setTeamDetails(map);
          setDetailError(null);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const message =
            err instanceof Error ? err.message : "Failed to load team details.";
          setDetailError(message);
        }
      } finally {
        if (!ignore) {
          setIsLoadingDetails(false);
        }
      }
    }

    void fetchTeams();

    return () => {
      ignore = true;
    };
  }, [datasetId]);

  if (previewRows.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-6 text-center">
        No preview rows returned. The file may be empty.
      </div>
    );
  }

  const { errors_count, warnings_count, duplicate_teams, duplicate_members, missing_fields_summary } =
    validationReport;

  // Build a readable summary of missing fields
  const missingFieldEntries = Object.entries(missing_fields_summary).filter(([, count]) => count > 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Validation summary — counts only (Day 4 will show full report) */}
      <div className="rounded-md border bg-muted/30 px-4 py-3 text-sm">
        <p className="font-medium mb-1">Upload summary</p>
        <ul className="text-muted-foreground space-y-0.5 text-xs">
          {errors_count > 0 && (
            <li className="text-red-700">
              {errors_count} error{errors_count !== 1 ? "s" : ""}
            </li>
          )}
          {warnings_count > 0 && (
            <li className="text-yellow-700">
              {warnings_count} warning{warnings_count !== 1 ? "s" : ""}
            </li>
          )}
          {errors_count === 0 && warnings_count === 0 && (
            <li className="text-green-700">No errors or warnings</li>
          )}
          {duplicate_teams.length > 0 && (
            <li>
              Duplicate team{duplicate_teams.length !== 1 ? "s" : ""}:{" "}
              {duplicate_teams.join(", ")}
            </li>
          )}
          {duplicate_members.length > 0 && (
            <li>
              Teams with duplicate member{duplicate_members.length !== 1 ? "s" : ""}:{" "}
              {duplicate_members.join(", ")}
            </li>
          )}
          {missingFieldEntries.length > 0 && (
            <li>
              Missing optional fields:{" "}
              {missingFieldEntries
                .map(([field, count]) => `${field} (${count})`)
                .join(", ")}
            </li>
          )}
        </ul>
      </div>

      {detailError && (
        <p role="alert" className="text-sm text-red-600">
          Could not load member details: {detailError}
        </p>
      )}

      {/* Preview table — first 20 rows from POST /upload */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">
          Showing {previewRows.length} of the uploaded teams. Click &quot;Show members&quot; to see
          per-field statuses.
          {previewRows.length === 20 && " Full team list loads on this page."}
        </p>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col" className="w-20">
                  Team ID
                </TableHead>
                <TableHead scope="col">Team Name</TableHead>
                <TableHead scope="col" className="w-24 text-right">
                  Members
                </TableHead>
                <TableHead scope="col" className="w-32">
                  Details
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewRows.map((row) => (
                <TeamRow
                  key={row.team_id}
                  previewRow={row}
                  teamDetail={teamDetails.get(row.team_id) ?? null}
                  isLoadingDetail={isLoadingDetails && !teamDetails.has(row.team_id)}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
