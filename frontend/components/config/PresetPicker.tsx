"use client";

/**
 * PresetPicker — choose a system preset or saved configuration to populate the editor.
 *
 * Day 5 scope (prd.md section 2 /config Day 5):
 *   - Lists available presets (is_preset: true) and custom saved configs (is_preset: false).
 *   - Selecting one loads its full config into local state.
 *   - Warns before overwriting if the user has unsaved local changes.
 *   - Text-based badges ("Preset" vs "Custom"), never relying on color alone.
 *   - Reuses available shadcn components (Card, Button, Badge).
 *   - Full keyboard accessibility and visible focus states.
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ConfigurationListItem } from "@/lib/types";

export interface PresetPickerProps {
  configs: ConfigurationListItem[];
  isLoading: boolean;
  error: string | null;
  selectedConfigId: string | null;
  hasUnsavedChanges: boolean;
  onSelectConfig: (configId: string) => void;
  onRetry?: () => void;
}

export function PresetPicker({
  configs,
  isLoading,
  error,
  selectedConfigId,
  hasUnsavedChanges,
  onSelectConfig,
  onRetry,
}: PresetPickerProps) {
  const [pendingConfigId, setPendingConfigId] = useState<string | null>(null);

  const presets = configs.filter((c) => c.is_preset);
  const customConfigs = configs.filter((c) => !c.is_preset);

  function handleSelect(id: string) {
    if (hasUnsavedChanges && id !== selectedConfigId) {
      setPendingConfigId(id);
    } else {
      setPendingConfigId(null);
      onSelectConfig(id);
    }
  }

  function confirmPendingLoad() {
    if (pendingConfigId) {
      const idToLoad = pendingConfigId;
      setPendingConfigId(null);
      onSelectConfig(idToLoad);
    }
  }

  function cancelPendingLoad() {
    setPendingConfigId(null);
  }

  const pendingConfig = configs.find((c) => c.id === pendingConfigId);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>Configuration Presets &amp; Saved Strategies</CardTitle>
            <CardDescription>
              Choose a starter preset or load a previously saved configuration to
              populate the scoring form.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {/* Loading state */}
        {isLoading && (
          <div
            role="status"
            className="flex items-center gap-2 py-4 text-sm text-muted-foreground"
          >
            <span className="animate-pulse">Loading available configurations…</span>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <p className="font-medium">Failed to load configurations</p>
            <p className="mt-1 text-xs text-red-700">{error}</p>
            {onRetry && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="mt-3"
              >
                Retry
              </Button>
            )}
          </div>
        )}

        {/* Inline Overwrite Confirmation Warning */}
        {pendingConfig && (
          <div
            role="alert"
            className="rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900"
          >
            <p className="font-medium">Unsaved changes detected</p>
            <p className="mt-1 text-xs text-yellow-800">
              Loading <strong>{pendingConfig.name}</strong> will overwrite your
              current in-progress criteria and weights. Are you sure you want to proceed?
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={confirmPendingLoad}
              >
                Discard changes &amp; load
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={cancelPendingLoad}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Group 1: System Presets */}
        {!isLoading && !error && (
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              System Presets
            </h3>
            {presets.length === 0 ? (
              <p className="text-xs text-muted-foreground">No presets available.</p>
            ) : (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {presets.map((preset) => {
                  const isCurrent = selectedConfigId === preset.id;
                  return (
                    <div
                      key={preset.id}
                      className={`flex flex-col justify-between rounded-lg border p-3.5 transition-colors ${
                        isCurrent
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="font-medium text-sm text-foreground">
                          {preset.name}
                        </span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                          Preset
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-muted-foreground">
                          {isCurrent ? "Active" : "Standard"}
                        </span>
                        <Button
                          type="button"
                          variant={isCurrent ? "outline" : "default"}
                          size="sm"
                          disabled={isCurrent}
                          aria-label={`Load ${preset.name} preset`}
                          onClick={() => handleSelect(preset.id)}
                        >
                          {isCurrent ? "Loaded" : "Load preset"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Group 2: Saved Custom Configurations */}
        {!isLoading && !error && (
          <div className="flex flex-col gap-3 pt-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Saved Configurations
            </h3>
            {customConfigs.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                No custom configurations saved yet. Create one below and click &ldquo;Save configuration&rdquo;.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {customConfigs.map((config) => {
                  const isCurrent = selectedConfigId === config.id;
                  const dateStr = config.created_at
                    ? new Date(config.created_at).toLocaleDateString()
                    : "";
                  return (
                    <div
                      key={config.id}
                      className={`flex flex-col justify-between rounded-lg border p-3.5 transition-colors ${
                        isCurrent
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="font-medium text-sm text-foreground">
                          {config.name}
                        </span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                          Custom
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-muted-foreground">
                          {dateStr ? `Saved ${dateStr}` : "Custom"}
                        </span>
                        <Button
                          type="button"
                          variant={isCurrent ? "outline" : "default"}
                          size="sm"
                          disabled={isCurrent}
                          aria-label={`Load ${config.name} configuration`}
                          onClick={() => handleSelect(config.id)}
                        >
                          {isCurrent ? "Loaded" : "Load config"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

