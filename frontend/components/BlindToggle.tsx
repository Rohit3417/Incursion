'use client';
import { EyeOff, Eye } from 'lucide-react';

interface BlindToggleProps {
  blind: boolean;
  onChange: (enabled: boolean) => void;
}

export default function BlindToggle({ blind, onChange }: BlindToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!blind)}
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-xs ${
        blind
          ? 'bg-purple-700 text-white border-purple-800 ring-2 ring-purple-300'
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900'
      }`}
      title="Anonymize candidate names, emails, and profile links to prevent unconscious bias"
    >
      {blind ? <EyeOff size={14} className="text-purple-200" /> : <Eye size={14} className="text-gray-500" />}
      <span>{blind ? 'Blind Mode: ON' : 'Blind Mode: OFF'}</span>
    </button>
  );
}