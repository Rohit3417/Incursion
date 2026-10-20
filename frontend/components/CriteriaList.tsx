'use client';
import { Trash2, Plus, Sparkles } from 'lucide-react';
import { Criterion } from '@/lib/types';

interface CriteriaListProps {
  criteria: Criterion[];
  onUpdate: (updated: Criterion[]) => void;
  onRemove: (index: number) => void;
  onAdd?: () => void;
}

export default function CriteriaList({
  criteria,
  onUpdate,
  onRemove,
  onAdd,
}: CriteriaListProps) {
  const handleNameChange = (index: number, name: string) => {
    const updated = [...criteria];
    updated[index] = { ...updated[index], name };
    onUpdate(updated);
  };

  const handleKeywordsChange = (index: number, raw: string) => {
    const updated = [...criteria];
    const keywords = raw
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    updated[index] = { ...updated[index], keywords };
    onUpdate(updated);
  };

  const handleAddCriterion = () => {
    if (onAdd) {
      onAdd();
    } else {
      onUpdate([
        ...criteria,
        { name: `Custom Criterion ${criteria.length + 1}`, weight: 0, keywords: [] },
      ]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
            <Sparkles size={16} className="text-indigo-600" />
            Evaluation Criteria & Target Keywords
          </h3>
          <p className="text-xs text-gray-500">
            Define scoring dimensions and comma-separated keywords for automated resume and profile matching.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddCriterion}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 transition-colors"
        >
          <Plus size={14} /> Add Criterion
        </button>
      </div>

      <div className="space-y-3">
        {criteria.map((c, index) => (
          <div
            key={index}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-3.5 border rounded-lg shadow-xs hover:border-gray-300 transition-colors"
          >
            <div className="sm:w-1/3">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-0.5">
                Dimension Name
              </label>
              <input
                type="text"
                value={c.name}
                onChange={(e) => handleNameChange(index, e.target.value)}
                className="w-full border rounded-md px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g., Technical Skills"
              />
            </div>

            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-0.5">
                Keywords (Comma Separated)
              </label>
              <input
                type="text"
                value={(c.keywords || []).join(', ')}
                onChange={(e) => handleKeywordsChange(index, e.target.value)}
                className="w-full border rounded-md px-3 py-1.5 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g., python, react, fastapi, docker, postgresql"
              />
            </div>

            <div className="flex items-center justify-end sm:pt-4">
              <button
                type="button"
                onClick={() => onRemove(index)}
                disabled={criteria.length <= 1}
                title={criteria.length <= 1 ? 'At least one criterion is required' : 'Remove criterion'}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}