"use client";

/**
 * TeamTable — full team list from GET /datasets/{dataset_id}/teams.
 *
 * Day 4 scope (prd.md section 2 /upload Day 4):
 *   - Shows all teams with team_id, team_name, member count
 *   - Expandable row per team revealing per-member field StatusBadges
 *   - Missing data shown as grey "Missing" badge (via StatusBadge) — never
 *     as a red zero or missing text
 *   - 1–6+ member teams all handled without layout breakage
 *
 * Differs from DataPreview (Day 2):
 *   - Receives Team[] from DatasetTeamsResponse (full member detail already loaded)
 *   - DataPreview works from UploadPreviewRow[] + loads detail on the fly
 *   - This component is the authoritative full-dataset table; DataPreview is
 *     a lightweight 20-row preview card
 *
 * Accessibility:
 *   - Expand/collapse via <button aria-expanded>
 *   - Long names truncated with title attribute
 *   - Tables use <th scope="col"> / <th scope="row">
 *   - Keyboard operable (native button, default focus ring preserved)
 *   - Color used as supplement only — labels always present in badges
 */

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { Team, Member, FieldStatus } from "@/lib/types";

// ---------------------------------------------------------------------------
// Sub-component: single member's field detail row (inside expanded team)
// ---------------------------------------------------------------------------

const OPTIONAL_FIELDS: { label: string; key: keyof Pick<Member, "github" | "resume" | "linkedin" | "portfolio"> }[] = [
  { label: "GitHub", key: "github" },
  { label: "Resume", key: "resume" },
  { label: "LinkedIn", key: "linkedin" },
  { label: "Portfolio", key: "portfolio" },
];

interface MemberDetailRowProps {
  member: Member;
  index: number;
}

function MemberDetailRow({ member, index }: MemberDetailRowProps) {
  return (
    <div className="pl-3 py-2 border-l-2 border-muted ml-1">
      {/* Member identity */}
      <p className="text-xs font-medium text-muted-foreground mb-1.5">
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
          <span className="text-yellow-600 ml-1">(name not provided — flagged)</span>
        )}
        {" · "}
        <span
          className="text-xs text-muted-foreground max-w-[220px] truncate inline-block align-bottom"
          title={member.email}
        >
          {member.email}
        </span>
      </p>

      {/* Optional field badges */}
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {OPTIONAL_FIELDS.map(({ label, key }) => {
          const field = member[key];
          return (
            <span key={key} className="flex items-center gap-1 text-xs">
              <span className="text-muted-foreground">{label}:</span>
              <StatusBadge status={field.status as FieldStatus} size="sm" />
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: per-team row (collapsible)
// ---------------------------------------------------------------------------

interface TeamRowProps {
  team: Team;
}

/**
 * Derives a compact field-status summary for the team row label:
 * e.g. "2 missing · 1 invalid" or "All OK" when everything is present.
 */
function deriveTeamStatusSummary(team: Team): { label: string; className: string } {
  let missingCount = 0;
  let invalidCount = 0;

  for (const member of team.members) {
    for (const key of ["github", "resume", "linkedin", "portfolio"] as const) {
      const { status } = member[key];
      if (status === "MISSING") missingCount++;
      else if (status === "INVALID") invalidCount++;
    }
  }

  if (missingCount === 0 && invalidCount === 0) {
    return { label: "All OK", className: "text-green-700" };
  }

  const parts: string[] = [];
  if (missingCount > 0) parts.push(`${missingCount} missing`);
  if (invalidCount > 0) parts.push(`${invalidCount} invalid`);

  return {
    label: parts.join(" · "),
    className: invalidCount > 0 ? "text-red-600" : "text-yellow-700",
  };
}

function TeamRow({ team }: TeamRowProps) {
  const [expanded, setExpanded] = useState(false);
  const summary = deriveTeamStatusSummary(team);

  return (
    <>
      <TableRow>
        {/* Team ID */}
        <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap w-20">
          {team.team_id}
        </TableCell>

        {/* Team name */}
        <TableCell>
          <span
            className="max-w-[200px] truncate inline-block align-bottom"
            title={team.team_name}
          >
            {team.team_name}
          </span>
        </TableCell>

        {/* Member count */}
        <TableCell className="text-right tabular-nums w-20">
          {team.members.length}
        </TableCell>

        {/* Status summary */}
        <TableCell className={`text-xs ${summary.className} w-40`}>
          {summary.label}
        </TableCell>

        {/* Expand/collapse */}
        <TableCell className="w-32">
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={`team-detail-${team.team_id}`}
            aria-label={`${expanded ? "Collapse" : "Expand"} member details for ${team.team_name}`}
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-primary underline underline-offset-2 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            {expanded ? "Collapse" : "View members"}
          </button>
        </TableCell>
      </TableRow>

      {/* Expanded member detail rows */}
      {expanded && (
        <TableRow id={`team-detail-${team.team_id}`}>
          <TableCell
            colSpan={5}
            className="bg-muted/30 py-2 px-4"
          >
            <div className="flex flex-col gap-2">
              {team.members.map((member, i) => (
                /*
                 * Stable key: member index is stable within a team's server
                 * response. team_id + index gives a unique, stable key.
                 * (No natural member ID exists in the contract.)
                 */
                <MemberDetailRow
                  key={`${team.team_id}-m${i}`}
                  member={member}
                  index={i}
                />
              ))}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main TeamTable component
// ---------------------------------------------------------------------------

export interface TeamTableProps {
  teams: Team[];
}

export function TeamTable({ teams }: TeamTableProps) {
  if (teams.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No team data available.
      </p>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead scope="col" className="w-20">Team ID</TableHead>
            <TableHead scope="col">Team Name</TableHead>
            <TableHead scope="col" className="w-20 text-right">Members</TableHead>
            <TableHead scope="col" className="w-40">Field Status</TableHead>
            <TableHead scope="col" className="w-32">Detail</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.map((team) => (
            <TeamRow key={team.team_id} team={team} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

