import { AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ValidationReport } from '@/lib/types';

interface ValidationPanelProps {
  report: ValidationReport | null;
}

export default function ValidationPanel({ report }: ValidationPanelProps) {
  if (!report) return null;

  const errors = report.errors || [];
  const warnings = report.warnings || [];
  const duplicates = report.duplicate_teams || [];

  const hasIssues = errors.length > 0 || warnings.length > 0 || duplicates.length > 0;

  if (!hasIssues) {
    return (
      <div className="mb-6 p-4 border rounded-xl bg-green-50/80 border-green-200 flex items-center gap-3">
        <CheckCircle2 size={20} className="text-green-600 shrink-0" />
        <div>
          <h4 className="text-sm font-bold text-green-900">Validation Passed Cleanly</h4>
          <p className="text-xs text-green-700">
            No malformed rows or critical schema errors detected in the registration file.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 border rounded-xl bg-white shadow-xs overflow-hidden">
      <div className="p-3.5 bg-amber-50/70 border-b border-amber-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="text-amber-700" />
          <h3 className="text-sm font-bold text-amber-900">Automated Validation Report</h3>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-200/80 text-amber-900">
          {errors.length} error(s), {warnings.length + duplicates.length} warning(s)
        </span>
      </div>

      <div className="p-4 space-y-4 text-xs">
        {errors.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="font-bold text-red-700 uppercase flex items-center gap-1.5">
              <AlertCircle size={14} /> Blocking Errors:
            </h4>
            <ul className="list-disc pl-5 text-red-600 space-y-0.5">
              {errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        {duplicates.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="font-bold text-amber-800 uppercase flex items-center gap-1.5">
              <AlertTriangle size={14} /> Duplicate Team Registrations:
            </h4>
            <ul className="list-disc pl-5 text-amber-700 space-y-0.5">
              {duplicates.map((d, i) => (
                <li key={i}>
                  Row {d.row}: Duplicate team name &quot;{d.team}&quot;
                </li>
              ))}
            </ul>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="font-bold text-amber-800 uppercase flex items-center gap-1.5">
              <AlertTriangle size={14} /> Missing Links & Duplicate Member Alerts:
            </h4>
            <ul className="list-disc pl-5 text-amber-700 space-y-0.5 max-h-48 overflow-y-auto">
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}