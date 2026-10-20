'use client';
import { useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';

interface OverrideDialogProps {
  isOpen: boolean;
  action: 'pin' | 'exclude' | 'waitlist' | null;
  teamName: string;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

export default function OverrideDialog({
  isOpen,
  action,
  teamName,
  onClose,
  onConfirm,
}: OverrideDialogProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !action) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('An audit reason is required for manual decisions.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await onConfirm(reason.trim());
      setReason('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to apply override');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getActionColor = () => {
    switch (action) {
      case 'pin':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'exclude':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      case 'waitlist':
        return 'text-amber-700 bg-amber-50 border-amber-200';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 border animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded border ${getActionColor()}`}>
                {action}
              </span>
              <h3 className="text-base font-bold text-gray-900">
                Override Decision
              </h3>
            </div>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              Target Team: <span className="font-semibold text-gray-800">{teamName}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 mb-4 flex items-start gap-2">
          <ShieldAlert size={16} className="text-amber-700 shrink-0 mt-0.5" />
          <span>
            Manual decisions are strictly logged in the audit trail. They change the final ranking order without erasing the automated algorithm score.
          </span>
        </div>

        {error && (
          <div className="p-2.5 mb-3 bg-red-50 text-red-700 text-xs rounded border border-red-200 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
              Audit Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={`e.g., Organizer verified exceptional live demo / disqualified due to conduct violation...`}
              className="w-full border rounded-lg p-2.5 text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer transition-colors shadow-xs"
            >
              {isSubmitting ? 'Recording...' : `Confirm ${action?.toUpperCase()}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}