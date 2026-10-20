import { CheckCircle2, XCircle, AlertCircle, Clock, Ban, Pin } from 'lucide-react';

interface StatusBadgeProps {
  status: string | any;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const statusStr = typeof status === 'string' ? status : status?.status || 'Unknown';
  const lower = statusStr.toLowerCase();

  if (lower.includes('pinned') || lower.includes('shortlisted (pinned)')) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
        <Pin size={12} className="text-emerald-700" /> Shortlisted (Pinned)
      </span>
    );
  }

  if (lower === 'shortlisted') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-900 border border-green-200">
        <CheckCircle2 size={12} className="text-green-600" /> Shortlisted
      </span>
    );
  }

  if (lower === 'waitlisted' || lower === 'waitlist') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200">
        <Clock size={12} className="text-amber-600" /> Waitlisted
      </span>
    );
  }

  if (lower === 'needs review' || lower.includes('review')) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-900 border border-yellow-200">
        <AlertCircle size={12} className="text-yellow-600" /> Needs review
      </span>
    );
  }

  if (lower === 'ineligible') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-900 border border-red-200">
        <XCircle size={12} className="text-red-600" /> Ineligible
      </span>
    );
  }

  if (lower === 'excluded') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-900 border border-rose-200">
        <Ban size={12} className="text-rose-600" /> Excluded
      </span>
    );
  }

  if (lower === 'not shortlisted') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
        Not shortlisted
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
      {statusStr}
    </span>
  );
}