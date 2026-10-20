'use client';
import { useState } from 'react';
import { Pin, Ban, Clock } from 'lucide-react';
import OverrideDialog from './OverrideDialog';
import { postOverride } from '@/lib/api';

interface OverrideButtonsProps {
  runId: string;
  teamId: string;
  teamName: string;
  currentAction?: 'pin' | 'exclude' | 'waitlist' | null | string;
  onOverrideSuccess?: () => void;
}

export default function OverrideButtons({
  runId,
  teamId,
  teamName,
  currentAction,
  onOverrideSuccess,
}: OverrideButtonsProps) {
  const [selectedAction, setSelectedAction] = useState<'pin' | 'exclude' | 'waitlist' | null>(null);

  const handleConfirm = async (reason: string) => {
    if (!selectedAction) return;
    await postOverride(runId, teamId, selectedAction, reason);
    if (onOverrideSuccess) {
      onOverrideSuccess();
    }
  };

  return (
    <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => setSelectedAction('pin')}
        title="Pin team to Shortlist"
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border transition-all cursor-pointer ${
          currentAction === 'pin'
            ? 'bg-green-600 text-white border-green-700 shadow-2xs'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-green-50 hover:text-green-800'
        }`}
      >
        <Pin size={11} /> Pin
      </button>

      <button
        type="button"
        onClick={() => setSelectedAction('waitlist')}
        title="Move team to Waitlist"
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border transition-all cursor-pointer ${
          currentAction === 'waitlist'
            ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-amber-50 hover:text-amber-800'
        }`}
      >
        <Clock size={11} /> Waitlist
      </button>

      <button
        type="button"
        onClick={() => setSelectedAction('exclude')}
        title="Exclude team from Shortlist"
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border transition-all cursor-pointer ${
          currentAction === 'exclude'
            ? 'bg-red-600 text-white border-red-700 shadow-2xs'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-red-50 hover:text-red-800'
        }`}
      >
        <Ban size={11} /> Exclude
      </button>

      <OverrideDialog
        isOpen={selectedAction !== null}
        action={selectedAction}
        teamName={teamName}
        onClose={() => setSelectedAction(null)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}