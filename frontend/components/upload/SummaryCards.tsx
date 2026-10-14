"use client";

/**
 * SummaryCards — four metric cards derived from a POST /upload response.
 *
 * Day 4 scope (prd.md section 2 /upload Day 4):
 *   - Total teams uploaded
 *   - Total members uploaded
 *   - Teams with at least one missing optional field
 *     (derived by counting teams in DatasetTeamsResponse whose members have
 *     any MISSING-status field — but at the page level we only have
 *     UploadResponse here, so we use validation_report.missing_fields_summary
 *     to show the aggregate missing-field count across all members, and the
 *     duplicate team/member lists for the duplicate card)
 *   - Duplicate teams + members detected
 *
 * Contract: props derive every displayed value from UploadResponse only.
 * No hardcoded values; zero counts are displayed positively (not hidden).
 *
 * Accessibility:
 *   - Each card has a visible heading and a tabular-nums value
 *   - Colour is supplemental — labels always present
 */

import { Card, CardContent } from "@/components/ui/card";
import type { UploadResponse } from "@/lib/types";

export interface SummaryCardsProps {
  uploadResponse: UploadResponse;
}

interface MetricCardProps {
  label: string;
  value: number | string;
  /** Tailwind text-colour class for the value — never the only indicator. */
  valueClass?: string;
  /** Optional sub-label shown below the value in muted text. */
  sub?: string;
}

function MetricCard({ label, value, valueClass = "text-foreground", sub }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
          {label}
        </p>
        <p className={`text-3xl font-semibold tabular-nums leading-none ${valueClass}`}>
          {value}
        </p>
        {sub && (
          <p className="text-xs text-muted-foreground mt-1">{sub}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function SummaryCards({ uploadResponse }: SummaryCardsProps) {
  const {
    total_teams,
    total_members,
    validation_report: {
      errors_count,
      warnings_count,
      duplicate_teams,
      duplicate_members,
      missing_fields_summary,
    },
  } = uploadResponse;

  // Total missing-field occurrences across all members (sum of per-field counts).
  // This is the best aggregate we can derive from UploadResponse alone;
  // the per-team view is in TeamTable which receives DatasetTeamsResponse.
  const totalMissingOccurrences = Object.values(missing_fields_summary).reduce(
    (acc, n) => acc + n,
    0
  );

  // Unique fields that have at least one missing value
  const distinctMissingFields = Object.keys(missing_fields_summary).filter(
    (k) => missing_fields_summary[k] > 0
  );

  // Duplicates = distinct team IDs flagged as duplicate teams + teams with
  // duplicate members. De-dupe in case a team_id appears in both lists.
  const duplicateSet = new Set([...duplicate_teams, ...duplicate_members]);
  const totalDuplicates = duplicateSet.size;

  // Issue indicator: problems exist when errors > 0 OR warnings > 0
  const hasIssues = errors_count > 0 || warnings_count > 0;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {/* 1 — Total teams */}
      <MetricCard label="Teams uploaded" value={total_teams} />

      {/* 2 — Total members */}
      <MetricCard label="Members uploaded" value={total_members} />

      {/* 3 — Missing fields (aggregate count of field-level gaps) */}
      <MetricCard
        label="Missing field occurrences"
        value={totalMissingOccurrences}
        valueClass={totalMissingOccurrences > 0 ? "text-yellow-700" : "text-green-700"}
        sub={
          totalMissingOccurrences > 0
            ? `Fields: ${distinctMissingFields.join(", ")}`
            : "All optional fields present"
        }
      />

      {/* 4 — Issues (errors + warnings) */}
      <MetricCard
        label="Validation issues"
        value={
          hasIssues
            ? `${errors_count}E / ${warnings_count}W`
            : "None"
        }
        valueClass={
          errors_count > 0
            ? "text-red-700"
            : warnings_count > 0
            ? "text-yellow-700"
            : "text-green-700"
        }
        sub={
          totalDuplicates > 0
            ? `${totalDuplicates} duplicate team${totalDuplicates !== 1 ? "s" : ""} detected`
            : "No duplicates detected"
        }
      />
    </div>
  );
}

