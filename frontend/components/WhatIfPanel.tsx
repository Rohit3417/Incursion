'use client';
import { useState } from 'react';
import { RotateCcw, Save, Sliders, CheckCircle2, AlertCircle } from 'lucide-react';
import { saveConfig } from '@/lib/api';
import { ScoringConfig } from '@/lib/types';

interface WhatIfPanelProps {
  config: ScoringConfig | null;
  onChange: (newConfig: ScoringConfig) => void;
  onReset: () => void;
  isReRanking: boolean;
  rankError: string;
}

export default function WhatIfPanel({
  config,
  onChange,
  onReset,
  isReRanking,
  rankError,
}: WhatIfPanelProps) {
  const [newConfigName, setNewConfigName] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!config || !config.criteria) return null;

  const totalWeight = config.criteria.reduce(
    (sum, c) => sum + Number(c.weight || 0),
    0
  );
  const isValid = totalWeight === 100;

  const handleWeightChange = (index: number, val: number) => {
    const updated = config.criteria.map((c, i) =>
      i === index ? { ...c, weight: Math.max(0, Math.min(100, val)) } : c
    );
    onChange({ ...config, criteria: updated });
  };

  const handleSaveAsNew = async () => {
    if (!newConfigName.trim() || !isValid) return;
    setIsSaving(true);
    setSaveMessage('');
    try {
      await saveConfig(newConfigName.trim(), config, false);
      setSaveMessage(`Saved as "${newConfigName.trim()}"!`);
      setNewConfigName('');
    } catch (err: any) {
      setSaveMessage(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white border rounded-xl p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Sliders size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              What-If Simulator (Live Re-Ranking Engine)
              {isReRanking && (
                <span className="text-[11px] font-normal text-indigo-600 animate-pulse bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                  Calculating Live Ranks...
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-500">
              Adjust criteria weights in real time to simulate shifts in the Top-X shortlist without altering stored database runs.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RotateCcw size={13} /> Revert to Baseline
        </button>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {config.criteria.map((c, idx) => (
          <div
            key={c.name}
            className="flex items-center gap-3 bg-gray-50/70 p-2.5 rounded-lg border border-gray-200"
          >
            <span className="text-xs font-semibold text-gray-700 w-32 truncate" title={c.name}>
              {c.name}
            </span>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={c.weight}
              onChange={(e) => handleWeightChange(idx, Number(e.target.value))}
              className="flex-1 accent-indigo-600 cursor-pointer h-2 bg-gray-200 rounded-lg"
            />
            <input
              type="number"
              min="0"
              max="100"
              value={c.weight}
              onChange={(e) => handleWeightChange(idx, Number(e.target.value))}
              className="w-14 border rounded-md p-1 text-right text-xs font-mono font-bold focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        ))}
      </div>

      {/* Footer Controls: Total Weight, Top-X Cutoff, Save As Preset */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t text-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <div
            className={`inline-flex items-center gap-1 font-bold ${
              isValid ? 'text-green-700' : 'text-red-600'
            }`}
          >
            {isValid ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            Total Weight: {totalWeight} / 100%
          </div>

          <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg border">
            <label className="text-gray-600 font-medium">Top-X Cutoff:</label>
            <input
              type="number"
              min="1"
              max="1000"
              value={config.top_x || 10}
              onChange={(e) => onChange({ ...config, top_x: Math.max(1, Number(e.target.value)) })}
              className="w-14 border rounded p-1 text-xs font-mono font-bold text-center bg-white"
            />
          </div>

          {rankError && (
            <span className="text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded border border-red-200">
              {rankError}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            placeholder="New preset name..."
            value={newConfigName}
            onChange={(e) => setNewConfigName(e.target.value)}
            className="border rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSaveAsNew}
            disabled={isSaving || !isValid || !newConfigName.trim()}
            className="inline-flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-40 cursor-pointer shadow-xs transition-colors"
          >
            <Save size={13} /> {isSaving ? 'Saving...' : 'Save As Strategy'}
          </button>
          {saveMessage && (
            <span className="text-xs text-green-700 font-semibold bg-green-50 px-2 py-1 rounded border border-green-200">
              {saveMessage}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}