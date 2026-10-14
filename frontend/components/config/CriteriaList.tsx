"use client";

/**
 * CriteriaList — add, edit, reorder, and remove scoring criteria.
 *
 * Day 3 scope (prd.md section 2 /config Day 3):
 *   - Add / remove / reorder criteria
 *   - Edit each criterion's name and keyword list
 *
 * Weight editing is intentionally NOT handled here; it lives in WeightControls
 * (design.md section 2 splits "CriteriaList" from the weight controls).
 *
 * Contract: uses the exact Criterion shape from frontend/lib/types.ts and
 * backend/app/scoring/config_schema.py (name, weight, keywords). No extra fields
 * are invented. No scoring is performed in the frontend.
 *
 * Accessibility (ui-ux-skill.md):
 *   - Every action is a native <button> with an accessible label.
 *   - Every field has an associated <label htmlFor>.
 *   - Reorder buttons expose direction and target in their aria-label.
 */

import { useId, useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CriterionWithId } from "@/lib/types";

interface CriteriaListProps {
  criteria: CriterionWithId[];
  onChange: (next: CriterionWithId[]) => void;
  nameErrors?: Record<string, string>;
}

interface CriterionRowProps {
  criterion: CriterionWithId;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  nameError?: string;
  onUpdate: (index: number, next: CriterionWithId) => void;
  onRemove: (index: number) => void;
  onMove: (index: number, direction: -1 | 1) => void;
}

function CriterionRow({
  criterion,
  index,
  isFirst,
  isLast,
  nameError,
  onUpdate,
  onRemove,
  onMove,
}: CriterionRowProps) {
  const [keywordDraft, setKeywordDraft] = useState("");
  const [nameTouched, setNameTouched] = useState(false);

  const nameId = useId();
  const keywordId = useId();
  const nameErrorId = useId();
  const position = index + 1;
  const nameInvalid = nameTouched && criterion.name.trim() === "";
  const hasError = Boolean(nameError) || nameInvalid;

  function handleNameChange(value: string) {
    onUpdate(index, { ...criterion, name: value });
  }

  function addKeyword() {
    const keyword = keywordDraft.trim();
    if (keyword === "") {
      return;
    }
    if (criterion.keywords.includes(keyword)) {
      setKeywordDraft("");
      return;
    }
    onUpdate(index, { ...criterion, keywords: [...criterion.keywords, keyword] });
    setKeywordDraft("");
  }

  function removeKeyword(keyword: string) {
    onUpdate(index, {
      ...criterion,
      keywords: criterion.keywords.filter((k) => k !== keyword),
    });
  }

  function handleKeywordKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addKeyword();
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">Criterion {position}</span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Move criterion ${position} up`}
            disabled={isFirst}
            onClick={() => onMove(index, -1)}
          >
            <ChevronUp />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Move criterion ${position} down`}
            disabled={isLast}
            onClick={() => onMove(index, 1)}
          >
            <ChevronDown />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Remove criterion ${position}`}
            onClick={() => onRemove(index)}
          >
            <Trash />
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={nameId} className="text-sm font-medium">
          Name
        </label>
        <Input
          id={nameId}
          value={criterion.name}
          onChange={(e) => handleNameChange(e.target.value)}
          onBlur={() => setNameTouched(true)}
          placeholder="e.g. technical_skills"
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? nameErrorId : undefined}
          className="max-w-xs"
        />
        {nameError ? (
          <p id={nameErrorId} role="alert" className="text-xs text-red-600 font-medium">
            {nameError}
          </p>
        ) : nameInvalid ? (
          <p id={nameErrorId} className="text-xs text-red-600">
            Criterion name is required.
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          Use the exact signal name the backend expects (e.g. technical_skills,
          projects, github_activity, achievements, portfolio).
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={keywordId} className="text-sm font-medium">
          Keywords
        </label>
        <div className="flex items-center gap-2">
          <Input
            id={keywordId}
            value={keywordDraft}
            onChange={(e) => setKeywordDraft(e.target.value)}
            onKeyDown={handleKeywordKeyDown}
            placeholder="e.g. Python"
            className="max-w-xs"
          />
          <Button type="button" variant="outline" size="sm" onClick={addKeyword}>
            Add
          </Button>
        </div>

        {criterion.keywords.length > 0 ? (
          <ul className="flex flex-wrap items-center gap-1.5 pt-1">
            {criterion.keywords.map((keyword) => (
              <li key={keyword}>
                <Badge variant="secondary" className="gap-1">
                  {keyword}
                  <button
                    type="button"
                    onClick={() => removeKeyword(keyword)}
                    aria-label={`Remove keyword ${keyword}`}
                    className="inline-flex items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="size-3" aria-hidden="true" />
                  </button>
                </Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">
            No keywords yet. Type a keyword and press Enter or click Add.
          </p>
        )}
      </div>
    </div>
  );
}

export function CriteriaList({ criteria, onChange, nameErrors }: CriteriaListProps) {
  function updateCriterion(index: number, next: CriterionWithId) {
    const updated = criteria.slice();
    updated[index] = next;
    onChange(updated);
  }

  function removeCriterion(index: number) {
    onChange(criteria.filter((_, i) => i !== index));
  }

  function moveCriterion(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= criteria.length) {
      return;
    }
    const updated = criteria.slice();
    [updated[index], updated[target]] = [updated[target], updated[index]];
    onChange(updated);
  }

  function addCriterion() {
    onChange([...criteria, { id: crypto.randomUUID(), name: "", weight: 0, keywords: [] }]);
  }

  return (
    <div className="flex flex-col gap-4">
      {criteria.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No criteria yet. Add at least one criterion to define how teams are scored.
        </p>
      ) : (
        <ol className="flex flex-col gap-3">
          {criteria.map((criterion, index) => (
            <li key={criterion.id}>
              <CriterionRow
                criterion={criterion}
                index={index}
                isFirst={index === 0}
                isLast={index === criteria.length - 1}
                nameError={nameErrors?.[criterion.id]}
                onUpdate={updateCriterion}
                onRemove={removeCriterion}
                onMove={moveCriterion}
              />
            </li>
          ))}
        </ol>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        onClick={addCriterion}
      >
        <Plus aria-hidden="true" />
        Add criterion
      </Button>
    </div>
  );
}
