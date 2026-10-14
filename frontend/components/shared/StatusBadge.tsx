"use client";

/**
 * StatusBadge — unified renderer for all status, eligibility, and
 * missing-data flags across the application.
 *
 * design.md section 6: "All status, eligibility, and missing-data flags …
 * must be rendered through components/shared/StatusBadge.tsx. This guarantees
 * that text labels … are always rendered alongside colors and remain identical
 * across the application."
 *
 * prd.md section 3: "Badges must carry text, not rely on color alone."
 *
 * Covers:
 *   FieldStatus (5-state): OK | MISSING | INVALID | UNAVAILABLE | UNCERTAIN
 *   EligibilityStatus:     Eligible | Ineligible | Needs review
 *   ShortlistStatus:       Shortlisted | Not shortlisted | Ineligible | Needs review | Shortlisted (Pinned)
 */

import type { FieldStatus, EligibilityStatus, ShortlistStatus } from "@/lib/types";

// Combined union of all status values this component handles
type AnyStatus = FieldStatus | EligibilityStatus | ShortlistStatus;

export interface StatusBadgeProps {
  status: AnyStatus;
  /** "sm" uses text-xs padding; default uses text-sm. */
  size?: "sm" | "default";
  /** Optional additional Tailwind classes for layout tweaks. */
  className?: string;
}

/** Returns Tailwind classes and human-readable label for any status value. */
function getStatusStyle(status: AnyStatus): {
  label: string;
  classes: string;
} {
  switch (status) {
    // FieldStatus — upload/enrichment stage
    case "OK":
      return {
        label: "OK",
        classes: "bg-green-100 text-green-800 border border-green-200",
      };
    case "MISSING":
      return {
        label: "Missing",
        classes: "bg-gray-100 text-gray-700 border border-gray-200",
      };
    case "INVALID":
      return {
        label: "Invalid",
        classes: "bg-red-100 text-red-700 border border-red-200",
      };
    case "UNAVAILABLE":
      return {
        label: "Unavailable",
        classes: "bg-yellow-100 text-yellow-800 border border-yellow-200",
      };
    case "UNCERTAIN":
      return {
        label: "Uncertain",
        classes: "bg-orange-100 text-orange-800 border border-orange-200",
      };

    // EligibilityStatus
    case "Eligible":
      return {
        label: "Eligible",
        classes: "bg-green-100 text-green-800 border border-green-200",
      };
    case "Ineligible":
      return {
        label: "Ineligible",
        classes: "bg-red-100 text-red-700 border border-red-200",
      };
    case "Needs review":
      return {
        label: "Needs review",
        classes: "bg-yellow-100 text-yellow-800 border border-yellow-200",
      };

    // ShortlistStatus
    case "Shortlisted":
      return {
        label: "Shortlisted",
        classes: "bg-blue-100 text-blue-800 border border-blue-200",
      };
    case "Not shortlisted":
      return {
        label: "Not shortlisted",
        classes: "bg-gray-100 text-gray-700 border border-gray-200",
      };
    case "Shortlisted (Pinned)":
      return {
        label: "Shortlisted (Pinned)",
        classes: "bg-blue-100 text-blue-800 border border-blue-300",
      };

    default: {
      // Exhaustive guard — TypeScript will catch unknown statuses at compile time,
      // but we keep a runtime fallback for future status values.
      const _exhaustive: never = status;
      void _exhaustive;
      return {
        label: String(status),
        classes: "bg-gray-100 text-gray-600 border border-gray-200",
      };
    }
  }
}

export function StatusBadge({ status, size = "default", className = "" }: StatusBadgeProps) {
  const { label, classes } = getStatusStyle(status);

  const sizeClasses =
    size === "sm"
      ? "text-xs px-1.5 py-0.5 rounded"
      : "text-sm px-2 py-0.5 rounded";

  return (
    <span
      className={`inline-flex items-center font-medium whitespace-nowrap ${sizeClasses} ${classes} ${className}`}
    >
      {label}
    </span>
  );
}
