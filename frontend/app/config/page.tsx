"use client";

/**
 * /config — Day 5: Connect Configure page to M4's /configs
 *
 * prd.md section 2 /config:
 *   Day 3: Full configuration UI in local state: criteria, weights with live 100-total check,
 *          top-X, aggregation, missing-data policy.
 *   Day 5: Connect to M4's /configs (list, get, save/create, load preset).
 *          Show backend validation errors next to relevant fields.
 *          Carry dataset_id in shared app state.
 *
 * Wires:
 *   - listConfigs() to populate PresetPicker
 *   - getConfig(id) to load a preset or saved config into local state
 *   - createConfig(payload) to save the configuration with backend persistence
 *   - useAppState: reads datasetId, writes configId upon save or load
 *
 * All Day 3 local-state behaviors (criteria add/remove/reorder, weights validation,
 * stable keys with crypto.randomUUID()) are fully preserved.
 */

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CriteriaList } from "@/components/config/CriteriaList";
import { WeightControls } from "@/components/config/WeightControls";
import { PresetPicker } from "@/components/config/PresetPicker";
import { useAppState } from "@/lib/app-state-context";
import { listConfigs, getConfig, createConfig, ApiError } from "@/lib/api";
import type {
  AggregationMethod,
  Criterion,
  CriterionWithId,
  MissingPolicy,
  ConfigurationListItem,
  ConfigurationRecord,
} from "@/lib/types";

const AGGREGATION_ITEMS: Record<string, string> = {
  mean: "Mean (average of member scores)",
  weighted_mean: "Weighted mean",
  at_least_one: "At least one member",
};

const MISSING_POLICY_ITEMS: Record<string, string> = {
  redistribute: "Redistribute (renormalize across available criteria)",
  neutral: "Neutral (missing contributes nothing)",
  penalty: "Penalty (missing reduces the score)",
};

interface BackendFieldErrors {
  name?: string;
  weights?: string;
  topX?: string;
  general?: string;
  criterionNames?: Record<string, string>;
}

export default function ConfigurePage() {
  const nameId = useId();
  const topXId = useId();
  const aggregationId = useId();
  const missingPolicyId = useId();

  const { datasetId, setConfigId } = useAppState();

  // Preset & saved configs list state
  const [configsList, setConfigsList] = useState<ConfigurationListItem[]>([]);
  const [isLoadingConfigs, setIsLoadingConfigs] = useState(true);
  const [configsListError, setConfigsListError] = useState<string | null>(null);
  const [activeConfigId, setActiveConfigId] = useState<string | null>(null);

  // Configuration editor state
  const [configName, setConfigName] = useState("");
  const [criteria, setCriteria] = useState<CriterionWithId[]>(() => [
    { id: crypto.randomUUID(), name: "", weight: 0, keywords: [] },
  ]);
  const [topX, setTopX] = useState(10);
  const [aggregation, setAggregation] = useState<AggregationMethod>("mean");
  const [missingPolicy, setMissingPolicy] = useState<MissingPolicy>("redistribute");

  // Baseline state snapshot to track unsaved local changes
  const [baselineSnapshot, setBaselineSnapshot] = useState<string>(() =>
    JSON.stringify({
      name: "",
      criteria: [{ name: "", weight: 0, keywords: [] }],
      topX: 10,
      aggregation: "mean",
      missingPolicy: "redistribute",
    })
  );

  // Saving state
  const [isSaving, setIsSaving] = useState(false);
  const [savedRecord, setSavedRecord] = useState<ConfigurationRecord | null>(null);
  const [backendErrors, setBackendErrors] = useState<BackendFieldErrors>({});

  // Compute if local state differs from last loaded / saved baseline
  const currentSnapshot = useMemo(() => {
    return JSON.stringify({
      name: configName.trim(),
      criteria: criteria.map(({ name, weight, keywords }) => ({
        name: name.trim(),
        weight,
        keywords,
      })),
      topX,
      aggregation,
      missingPolicy,
    });
  }, [configName, criteria, topX, aggregation, missingPolicy]);

  const hasUnsavedChanges = currentSnapshot !== baselineSnapshot;

  // Validation
  const totalWeights = criteria.reduce((sum, c) => sum + c.weight, 0);
  const hasValidCriteriaCount = criteria.length >= 1;
  const allNamesNonEmpty = criteria.every((c) => c.name.trim() !== "");
  const hasValidTotalWeights = totalWeights === 100;
  const canSave = hasValidCriteriaCount && allNamesNonEmpty && hasValidTotalWeights && !isSaving;

  // tie_break must terminate with "team_id" (config_schema.py + api-contract.md).
  const tieBreak = useMemo(() => {
    const names = criteria.map((c) => c.name.trim()).filter((n) => n !== "");
    return [...names, "team_id"];
  }, [criteria]);

  // Load configs list on mount
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const list = await listConfigs();
        if (!ignore) {
          setConfigsList(list);
          setConfigsListError(null);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg =
            err instanceof Error ? err.message : "Failed to load configurations list";
          setConfigsListError(msg);
        }
      } finally {
        if (!ignore) {
          setIsLoadingConfigs(false);
        }
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [refreshTrigger]);

  const handleRetryLoad = useCallback(() => {
    setIsLoadingConfigs(true);
    setConfigsListError(null);
    setRefreshTrigger((n) => n + 1);
  }, []);


  // Load a chosen configuration (preset or custom) into the editor
  async function handleSelectConfig(id: string) {
    try {
      const record = await getConfig(id);

      // Populate local state
      setConfigName(record.name);
      setCriteria(
        record.config_json.criteria.map((c) => ({
          id: crypto.randomUUID(),
          name: c.name,
          weight: c.weight,
          keywords: c.keywords ?? [],
        }))
      );
      setTopX(record.config_json.top_x);
      setAggregation(record.config_json.aggregation);
      setMissingPolicy(record.config_json.missing_policy);

      // Update baseline snapshot
      const newSnapshot = JSON.stringify({
        name: record.name.trim(),
        criteria: record.config_json.criteria.map((c) => ({
          name: c.name.trim(),
          weight: c.weight,
          keywords: c.keywords ?? [],
        })),
        topX: record.config_json.top_x,
        aggregation: record.config_json.aggregation,
        missingPolicy: record.config_json.missing_policy,
      });
      setBaselineSnapshot(newSnapshot);

      setActiveConfigId(record.id);
      setConfigId(record.id); // wire to shared app state context
      setSavedRecord(null);
      setBackendErrors({});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load configuration";
      setBackendErrors({ general: msg });
    }
  }

  function handleTopXChange(raw: string) {
    if (raw.trim() === "") {
      setTopX(1);
      return;
    }
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      return;
    }
    setTopX(Math.max(1, Math.round(value)));
  }

  // Save configuration via API
  async function handleSave() {
    if (!canSave) {
      return;
    }

    setIsSaving(true);
    setBackendErrors({});

    const backendCriteria: Criterion[] = criteria.map(({ name, weight, keywords }) => ({
      name: name.trim(),
      weight,
      keywords,
    }));

    const payload = {
      name: configName.trim() === "" ? "Untitled configuration" : configName.trim(),
      is_preset: false,
      config_json: {
        criteria: backendCriteria,
        eligibility_rules: [],
        top_x: topX,
        aggregation,
        missing_policy: missingPolicy,
        tie_break: tieBreak,
      },
    };

    try {
      const created = await createConfig(payload);

      setSavedRecord(created);
      setActiveConfigId(created.id);
      setConfigId(created.id); // wire to shared app state context

      // Update baseline snapshot so hasUnsavedChanges is reset
      const newSnapshot = JSON.stringify({
        name: created.name.trim(),
        criteria: created.config_json.criteria.map((c) => ({
          name: c.name.trim(),
          weight: c.weight,
          keywords: c.keywords ?? [],
        })),
        topX: created.config_json.top_x,
        aggregation: created.config_json.aggregation,
        missingPolicy: created.config_json.missing_policy,
      });
      setBaselineSnapshot(newSnapshot);

      // Refresh configs list so the newly saved config appears in PresetPicker
      setRefreshTrigger((n) => n + 1);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.validationErrors && err.validationErrors.length > 0) {
        const errors: BackendFieldErrors = {};
        const criterionErrors: Record<string, string> = {};

        for (const vErr of err.validationErrors) {
          const loc = vErr.loc;
          const criteriaIdx = loc.indexOf("criteria");

          // Exact loc path for criterion name error:
          // e.g. ["body", "config_json", "criteria", 0, "name"]
          if (
            criteriaIdx !== -1 &&
            typeof loc[criteriaIdx + 1] === "number" &&
            loc[criteriaIdx + 2] === "name"
          ) {
            const idx = loc[criteriaIdx + 1] as number;
            const criterion = criteria[idx];
            if (criterion) {
              criterionErrors[criterion.id] = vErr.msg;
            } else {
              errors.general = vErr.msg;
            }
          } else if (
            criteriaIdx !== -1 &&
            (loc.length === criteriaIdx + 1 || loc.includes("weight") || loc.includes("weights"))
          ) {
            // Criteria-level error, e.g. ["body", "config_json", "criteria"] (weights sum or count)
            errors.weights = vErr.msg;
          } else if (loc.includes("name") && criteriaIdx === -1) {
            // Configuration identity name error, e.g. ["body", "name"]
            errors.name = vErr.msg;
          } else if (loc.includes("top_x")) {
            // Top X error, e.g. ["body", "config_json", "top_x"]
            errors.topX = vErr.msg;
          } else {
            // Catch-all general error
            errors.general = vErr.msg;
          }
        }

        if (Object.keys(criterionErrors).length > 0) {
          errors.criterionNames = criterionErrors;
        }

        setBackendErrors(errors);
      } else {
        const msg = err instanceof Error ? err.message : "Failed to save configuration.";
        setBackendErrors({ general: msg });
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">Configure</h1>
          <p className="text-sm text-muted-foreground">
            Set criteria, weights, and selection policies. Weights must sum to
            100 before the configuration can be saved.
          </p>
        </header>

        {/* Dataset context banner */}
        <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-xs">
          {datasetId ? (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">Dataset linked:</span>
              <code className="font-mono text-muted-foreground bg-background px-1.5 py-0.5 rounded border">
                {datasetId}
              </code>
              <span className="text-muted-foreground">
                (This configuration will evaluate this dataset on Day 7)
              </span>
            </div>
          ) : (
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">No dataset uploaded yet</span> —
              you can still build or select a configuration, but you will need to upload
              a registration file before running an evaluation.
            </p>
          )}
        </div>

        {/* Preset & Saved Configs Picker */}
        <PresetPicker
          configs={configsList}
          isLoading={isLoadingConfigs}
          error={configsListError}
          selectedConfigId={activeConfigId}
          hasUnsavedChanges={hasUnsavedChanges}
          onSelectConfig={handleSelectConfig}
          onRetry={handleRetryLoad}
        />

        {/* Configuration identity */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>
              A name for this scoring strategy. Saving persists the strategy to the
              database (Day 5).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <label htmlFor={nameId} className="text-sm font-medium">
              Configuration name
            </label>
            <Input
              id={nameId}
              value={configName}
              onChange={(e) => {
                setConfigName(e.target.value);
                if (backendErrors.name) {
                  setBackendErrors((prev) => ({ ...prev, name: undefined }));
                }
              }}
              placeholder="e.g. Balanced Hackathon Default"
              className="max-w-sm"
            />
            {/* Backend error displayed beside name field */}
            {backendErrors.name && (
              <p role="alert" className="text-xs text-red-600 font-medium">
                {backendErrors.name}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Criteria */}
        <Card>
          <CardHeader>
            <CardTitle>Criteria</CardTitle>
            <CardDescription>
              Add, edit, reorder, or remove criteria. Each criterion is scored
              0–100 by the backend and combined using the weights below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CriteriaList
              criteria={criteria}
              nameErrors={backendErrors.criterionNames}
              onChange={(next) => {
                setCriteria(next);
                setBackendErrors((prev) => {
                  if (!prev.weights && !prev.criterionNames) {
                    return prev;
                  }
                  const nextErrors = { ...prev };
                  if (nextErrors.weights) {
                    nextErrors.weights = undefined;
                  }
                  if (nextErrors.criterionNames) {
                    const updatedNames = { ...nextErrors.criterionNames };
                    let hasChanged = false;
                    for (const id of Object.keys(updatedNames)) {
                      const oldCrit = criteria.find((c) => c.id === id);
                      const newCrit = next.find((c) => c.id === id);
                      // Clear error if criterion was deleted or its name was edited
                      if (!newCrit || (oldCrit && newCrit.name !== oldCrit.name)) {
                        delete updatedNames[id];
                        hasChanged = true;
                      }
                    }
                    if (hasChanged) {
                      nextErrors.criterionNames =
                        Object.keys(updatedNames).length > 0 ? updatedNames : undefined;
                    }
                  }
                  return nextErrors;
                });
              }}
            />
          </CardContent>
        </Card>

        {/* Weights */}
        <Card>
          <CardHeader>
            <CardTitle>Weights</CardTitle>
            <CardDescription>
              Enter a numeric weight (0–100) per criterion. The total must equal
              100.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <WeightControls
              criteria={criteria}
              onChange={(next) => {
                setCriteria(next);
                if (backendErrors.weights) {
                  setBackendErrors((prev) => ({ ...prev, weights: undefined }));
                }
              }}
            />
            {/* Backend error displayed beside weights total */}
            {backendErrors.weights && (
              <p role="alert" className="text-xs text-red-600 font-medium">
                {backendErrors.weights}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Selection and policies */}
        <Card>
          <CardHeader>
            <CardTitle>Selection &amp; data policy</CardTitle>
            <CardDescription>
              How many teams to shortlist and how missing data is handled.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor={topXId} className="text-sm font-medium">
                Top X (number of teams to shortlist)
              </label>
              <Input
                id={topXId}
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                value={topX}
                onChange={(e) => {
                  handleTopXChange(e.target.value);
                  if (backendErrors.topX) {
                    setBackendErrors((prev) => ({ ...prev, topX: undefined }));
                  }
                }}
                className="w-28 text-right tabular-nums"
              />
              {/* Backend error displayed beside top_x field */}
              {backendErrors.topX && (
                <p role="alert" className="text-xs text-red-600 font-medium">
                  {backendErrors.topX}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor={aggregationId} className="text-sm font-medium">
                Aggregation method
              </label>
              <Select
                items={AGGREGATION_ITEMS}
                value={aggregation}
                onValueChange={(value) => {
                  if (typeof value === "string") {
                    setAggregation(value as AggregationMethod);
                  }
                }}
              >
                <SelectTrigger id={aggregationId} className="w-full max-w-sm">
                  <SelectValue placeholder="Select aggregation method" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(AGGREGATION_ITEMS) as AggregationMethod[]).map(
                    (value) => (
                      <SelectItem key={value} value={value}>
                        {AGGREGATION_ITEMS[value]}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor={missingPolicyId} className="text-sm font-medium">
                Missing-data policy
              </label>
              <Select
                items={MISSING_POLICY_ITEMS}
                value={missingPolicy}
                onValueChange={(value) => {
                  if (typeof value === "string") {
                    setMissingPolicy(value as MissingPolicy);
                  }
                }}
              >
                <SelectTrigger id={missingPolicyId} className="w-full max-w-sm">
                  <SelectValue placeholder="Select missing-data policy" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(MISSING_POLICY_ITEMS) as MissingPolicy[]).map(
                    (value) => (
                      <SelectItem key={value} value={value}>
                        {MISSING_POLICY_ITEMS[value]}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Tie-break order</span>
              <p className="text-xs text-muted-foreground">
                Derived from the criteria order and always terminates with{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                  team_id
                </code>{" "}
                for deterministic ranking.
              </p>
              <p className="font-mono text-xs text-foreground" title={tieBreak.join(" → ")}>
                {tieBreak.join(" → ")}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Eligibility rules</span>
              <p className="text-xs text-muted-foreground">
                Hard pass/fail rules (e.g. minimum team size, mandatory links)
                are evaluated separately from scoring. No rules added — the
                eligibility-rule editor is not part of Day 5.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save */}
        <div className="flex flex-col gap-3">
          {backendErrors.general && (
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700"
            >
              {backendErrors.general}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button
              type="button"
              disabled={!canSave}
              onClick={handleSave}
            >
              {isSaving ? "Saving…" : "Save configuration"}
            </Button>
            {!canSave && !isSaving && (
              <span className="text-sm text-muted-foreground">
                {criteria.length === 0
                  ? "Add at least one criterion to save."
                  : !allNamesNonEmpty
                  ? "Every criterion must have a name."
                  : `Weights must sum to 100 (currently ${totalWeights}).`}
              </span>
            )}
          </div>

          {savedRecord && (
            <div
              role="status"
              className="flex flex-col gap-2 rounded-lg border border-green-200 bg-green-50/50 p-4"
            >
              <p className="text-sm text-green-900">
                ✓ Saved configuration <strong>{savedRecord.name}</strong> with ID{" "}
                <code className="font-mono text-xs bg-background px-1.5 py-0.5 rounded border border-green-200 text-green-800">
                  {savedRecord.id}
                </code>
              </p>
              <p className="text-xs text-muted-foreground">
                Configuration is saved and active. On Day 7, you can evaluate it against the dataset.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
