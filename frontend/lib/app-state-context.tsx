"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

/**
 * Day 1 placeholder — required by design.md section 5.
 *
 * Provides shared pipeline IDs so later days do not require a layout.tsx
 * refactor:
 *   - dataset_id: populated starting Day 4 (POST /upload response)
 *   - config_id:  populated starting Day 5 (POST /configs or selection)
 *   - run_id:     populated starting Day 7 (POST /runs response)
 *
 * All values are initialised to null and currently unused.
 */

interface AppState {
  datasetId: string | null;
  setDatasetId: (id: string | null) => void;
  configId: string | null;
  setConfigId: (id: string | null) => void;
  runId: string | null;
  setRunId: (id: string | null) => void;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [configId, setConfigId] = useState<string | null>(null);
  const [runId, setRunId] = useState<string | null>(null);

  return (
    <AppStateContext.Provider
      value={{ datasetId, setDatasetId, configId, setConfigId, runId, setRunId }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppState {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return ctx;
}
