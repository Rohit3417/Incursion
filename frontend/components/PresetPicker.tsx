'use client';
import { SlidersHorizontal } from 'lucide-react';
import { ConfigRecord, ScoringConfig } from '@/lib/types';

interface PresetPickerProps {
  presets: ConfigRecord[];
  onSelect: (config: ScoringConfig, name: string) => void;
  selectedPresetId?: string;
}

export default function PresetPicker({
  presets,
  onSelect,
  selectedPresetId,
}: PresetPickerProps) {
  if (!presets || presets.length === 0) return null;

  return (
    <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
      <div className="flex items-center gap-2.5">
        <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-xs">
          <SlidersHorizontal size={16} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-gray-900">Load Strategy Preset</h4>
          <p className="text-xs text-gray-600">
            Choose from battle-tested scoring configurations (Balanced, Skills-Heavy, or Projects-Heavy).
          </p>
        </div>
      </div>

      <div className="sm:w-64">
        <select
          value={selectedPresetId || ''}
          onChange={(e) => {
            const found = presets.find((p) => p.id === e.target.value);
            if (found) {
              onSelect(found.config_json, found.name);
            }
          }}
          className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-xs font-semibold text-gray-800 shadow-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        >
          <option value="" disabled>
            Select a preset strategy...
          </option>
          {presets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}