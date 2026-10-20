'use client';
import { Sliders, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Criterion } from '@/lib/types';

interface WeightSlidersProps {
  criteria: Criterion[];
  onUpdate: (updated: Criterion[]) => void;
}

export default function WeightSliders({ criteria, onUpdate }: WeightSlidersProps) {
  const totalWeight = criteria.reduce((sum, c) => sum + Number(c.weight || 0), 0);
  const isValid = totalWeight === 100;

  const handleSliderChange = (index: number, val: number) => {
    const updated = [...criteria];
    updated[index] = { ...updated[index], weight: Math.max(0, Math.min(100, val)) };
    onUpdate(updated);
  };

  return (
    <div className="bg-white p-5 border rounded-xl shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <Sliders size={16} className="text-indigo-600" />
          <h3 className="text-sm font-bold text-gray-900">Dimension Weights (%)</h3>
        </div>
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold font-mono border ${
            isValid
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          {isValid ? (
            <CheckCircle2 size={13} className="text-green-600" />
          ) : (
            <AlertCircle size={13} className="text-red-600" />
          )}
          Total: {totalWeight} / 100%
        </div>
      </div>

      <div className="space-y-3">
        {criteria.map((c, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-gray-700 truncate max-w-[180px]" title={c.name}>
                {c.name}
              </span>
              <span className="font-mono font-semibold text-gray-900">{c.weight}%</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={c.weight}
                onChange={(e) => handleSliderChange(index, Number(e.target.value))}
                className="flex-1 accent-indigo-600 cursor-pointer h-2 bg-gray-200 rounded-lg"
              />
              <input
                type="number"
                min="0"
                max="100"
                value={c.weight}
                onChange={(e) => handleSliderChange(index, Number(e.target.value))}
                className="w-16 border rounded px-2 py-1 text-right text-xs font-mono font-semibold focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        ))}
      </div>

      {!isValid && (
        <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 flex items-start gap-1.5">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span>
            Weights must sum to exactly 100% (currently {totalWeight}%). Adjust the sliders before saving.
          </span>
        </div>
      )}
    </div>
  );
}