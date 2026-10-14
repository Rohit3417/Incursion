"use client";

/**
 * WeightControls — numeric weight entry per criterion with a live 100-total check.
 *
 * Day 3 scope (prd.md section 2 /config Day 3): "weight sliders and number inputs
 * with a live total that must equal 100 before saving is allowed".
 *
 * Range sliders are intentionally NOT used on Day 3 (no live API call to justify
 * them; see the Day Completion handoff). Each weight is a numeric <Input> with
 * min=0, max=100, step=1, matching Criterion.weight in frontend/lib/types.ts and
 * Criterion.weight (int 0-100) in backend/app/scoring/config_schema.py.
 *
 * The total is displayed as TEXT (never color alone) and the validity is stated
 * explicitly so the state is perceivable without color.
 */

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { CriterionWithId } from "@/lib/types";

interface WeightControlsProps {
  criteria: CriterionWithId[];
  onChange: (next: CriterionWithId[]) => void;
}

function clampWeight(raw: number): number {
  if (!Number.isFinite(raw)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export function WeightControls({ criteria, onChange }: WeightControlsProps) {
  const total = criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
  const isValidTotal = total === 100;

  function setWeight(index: number, raw: string) {
    const value = raw.trim() === "" ? 0 : clampWeight(Number(raw));
    const updated = criteria.slice();
    updated[index] = { ...updated[index], weight: value };
    onChange(updated);
  }

  return (
    <div className="flex flex-col gap-4">
      {criteria.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Add a criterion above to set its weight.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {criteria.map((criterion, index) => {
            const weightId = `criterion-${criterion.id}-weight`;
            const label =
              criterion.name.trim() === ""
                ? `Criterion ${index + 1}`
                : criterion.name;
            return (
              <li key={criterion.id} className="flex items-center gap-3">
                <label
                  htmlFor={weightId}
                  className="min-w-0 flex-1 text-sm font-medium"
                >
                  <span
                    className="inline-block max-w-full truncate align-bottom"
                    title={label}
                  >
                    {label}
                  </span>
                </label>
                <Input
                  id={weightId}
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  inputMode="numeric"
                  value={criterion.weight}
                  onChange={(e) => setWeight(index, e.target.value)}
                  className="w-20 text-right tabular-nums"
                />
              </li>
            );
          })}
        </ul>
      )}

      <div
        role="status"
        aria-live="polite"
        className={cn(
          "flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm",
          isValidTotal
            ? "border-green-200 bg-green-50 text-green-800"
            : "border-yellow-200 bg-yellow-50 text-yellow-800"
        )}
      >
        <span className="font-medium tabular-nums">
          Weight total: {total} / 100
        </span>
        <span>
          {isValidTotal
            ? "Weights sum to 100."
            : `Weights must sum to 100 (currently ${total}).`}
        </span>
      </div>
    </div>
  );
}
