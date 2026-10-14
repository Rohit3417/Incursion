"use client";

/**
 * ValidationPanel — structured display of the ValidationReport from POST /upload.
 *
 * Day 4 scope (prd.md section 2 /upload Day 4):
 *   - Errors section (heading + count) — structurally separate from warnings
 *   - Warnings section (heading + count)
 *   - missing_fields_summary breakdown (per-field counts)
 *   - duplicate_teams list (team IDs)
 *   - duplicate_members list (team IDs whose members are duplicated)
 *   - Zero-state positive confirmation when both counts are 0 and no duplicates
 *
 * IMPORTANT: The api-contract.md v1.0 ValidationReport provides aggregate
 * counts and ID lists only — NOT per-row error messages with row references.
 * This panel renders exactly what the contract provides; it does not invent
 * row-level detail objects.
 *
 * Accessibility:
 *   - Sections use <section> with aria-labelledby
 *   - Error/warning counts paired with visible text (not icon-only)
 *   - Scrollable inner region capped at max-h so long lists don't push
 *     the rest of the page out of view
 */

import type { ValidationReport } from "@/lib/types";

export interface ValidationPanelProps {
  validationReport: ValidationReport;
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

interface SectionHeadingProps {
  id: string;
  label: string;
  count: number;
  /** Tailwind colour applied to count badge only — label always present. */
  countClass: string;
}

function SectionHeading({ id, label, count, countClass }: SectionHeadingProps) {
  return (
    <h3
      id={id}
      className="flex items-center gap-2 text-sm font-semibold text-foreground"
    >
      {label}
      <span
        className={`inline-flex items-center justify-center min-w-[1.4rem] rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums ${countClass}`}
      >
        {count}
      </span>
    </h3>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ValidationPanel({ validationReport }: ValidationPanelProps) {
  const {
    errors_count,
    warnings_count,
    duplicate_teams,
    duplicate_members,
    missing_fields_summary,
  } = validationReport;

  const hasMissingFields = Object.values(missing_fields_summary).some((n) => n > 0);
  const hasDuplicateTeams = duplicate_teams.length > 0;
  const hasDuplicateMembers = duplicate_members.length > 0;
  const isClean =
    errors_count === 0 &&
    warnings_count === 0 &&
    !hasDuplicateTeams &&
    !hasDuplicateMembers;

  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Validation Report
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* Zero-state: positive confirmation                                    */}
      {/* ------------------------------------------------------------------ */}
      {isClean && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          ✓ No errors, warnings, or duplicate entries found. The dataset is clean.
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Errors                                                               */}
      {/* ------------------------------------------------------------------ */}
      <section aria-labelledby="vp-errors-heading">
        <SectionHeading
          id="vp-errors-heading"
          label="Errors"
          count={errors_count}
          countClass={
            errors_count > 0
              ? "bg-red-100 text-red-700 border border-red-200"
              : "bg-gray-100 text-gray-500 border border-gray-200"
          }
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {errors_count === 0
            ? "No errors detected."
            : `${errors_count} error${errors_count !== 1 ? "s" : ""} found. The dataset may need correction before processing.`}
        </p>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Warnings                                                             */}
      {/* ------------------------------------------------------------------ */}
      <section aria-labelledby="vp-warnings-heading">
        <SectionHeading
          id="vp-warnings-heading"
          label="Warnings"
          count={warnings_count}
          countClass={
            warnings_count > 0
              ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
              : "bg-gray-100 text-gray-500 border border-gray-200"
          }
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {warnings_count === 0
            ? "No warnings."
            : `${warnings_count} warning${warnings_count !== 1 ? "s" : ""}. Processing can continue but review is recommended.`}
        </p>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Missing fields summary                                               */}
      {/* ------------------------------------------------------------------ */}
      {hasMissingFields && (
        <section aria-labelledby="vp-missing-heading">
          <h3
            id="vp-missing-heading"
            className="text-sm font-semibold text-foreground mb-2"
          >
            Missing optional fields
          </h3>
          <div className="max-h-48 overflow-y-auto rounded-md border bg-muted/30">
            <ul className="divide-y divide-border">
              {Object.entries(missing_fields_summary)
                .filter(([, count]) => count > 0)
                .sort(([, a], [, b]) => b - a) // descending by count
                .map(([field, count]) => (
                  <li
                    key={field}
                    className="flex items-center justify-between px-4 py-2 text-sm"
                  >
                    <span className="font-mono text-xs text-foreground">{field}</span>
                    <span className="tabular-nums text-xs text-muted-foreground">
                      {count} member{count !== 1 ? "s" : ""} missing
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Duplicate teams                                                      */}
      {/* ------------------------------------------------------------------ */}
      {hasDuplicateTeams && (
        <section aria-labelledby="vp-dup-teams-heading">
          <h3
            id="vp-dup-teams-heading"
            className="text-sm font-semibold text-foreground mb-2"
          >
            Duplicate teams{" "}
            <span className="text-xs font-normal text-muted-foreground">
              ({duplicate_teams.length})
            </span>
          </h3>
          <div className="max-h-32 overflow-y-auto rounded-md border bg-muted/30">
            <ul className="flex flex-wrap gap-2 px-4 py-3">
              {duplicate_teams.map((id) => (
                <li key={id}>
                  <span className="font-mono text-xs bg-red-50 text-red-700 border border-red-200 rounded px-2 py-0.5">
                    {id}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Duplicate members (teams that contain duplicate member entries)      */}
      {/* ------------------------------------------------------------------ */}
      {hasDuplicateMembers && (
        <section aria-labelledby="vp-dup-members-heading">
          <h3
            id="vp-dup-members-heading"
            className="text-sm font-semibold text-foreground mb-2"
          >
            Teams with duplicate members{" "}
            <span className="text-xs font-normal text-muted-foreground">
              ({duplicate_members.length})
            </span>
          </h3>
          <div className="max-h-32 overflow-y-auto rounded-md border bg-muted/30">
            <ul className="flex flex-wrap gap-2 px-4 py-3">
              {duplicate_members.map((id) => (
                <li key={id}>
                  <span className="font-mono text-xs bg-yellow-50 text-yellow-800 border border-yellow-200 rounded px-2 py-0.5">
                    {id}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}

