'use client';
import { Download, FileArchive, CheckCircle2 } from 'lucide-react';
import { getExportDownloadUrl } from '@/lib/api';

interface ExportBarProps {
  runId: string | null;
  blind?: boolean;
}

export default function ExportBar({ runId, blind = false }: ExportBarProps) {
  if (!runId) return null;

  const exportTypes: Array<{
    label: string;
    type: 'shortlist' | 'waitlist' | 'rejected' | 'breakdown';
    color: string;
  }> = [
    { label: 'Shortlist', type: 'shortlist', color: 'border-green-200 hover:bg-green-50 text-green-700' },
    { label: 'Waitlist', type: 'waitlist', color: 'border-amber-200 hover:bg-amber-50 text-amber-700' },
    { label: 'Rejected', type: 'rejected', color: 'border-rose-200 hover:bg-rose-50 text-rose-700' },
    { label: 'Full Breakdown', type: 'breakdown', color: 'border-blue-200 hover:bg-blue-50 text-blue-700' },
  ];

  return (
    <div className="bg-white border rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <Download size={16} className="text-gray-700" />
          <h4 className="text-sm font-bold text-gray-900">Auditable Export Center</h4>
          {blind && (
            <span className="text-[10px] font-semibold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
              Anonymized Blind Mode
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          Download CSV and JSON reports containing automated ranks, manual override logs, and full criterion weights.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {exportTypes.map((item) => (
          <div key={item.type} className="inline-flex rounded-lg shadow-2xs border overflow-hidden text-xs bg-white">
            <span className="bg-gray-50 px-2.5 py-1.5 font-medium text-gray-700 border-r border-gray-200">
              {item.label}
            </span>
            <a
              href={getExportDownloadUrl(runId, item.type, 'csv', blind)}
              download
              className="px-2 py-1.5 font-mono text-blue-600 hover:bg-blue-50 border-r border-gray-200 transition-colors"
              title={`Download ${item.label} CSV`}
            >
              CSV
            </a>
            <a
              href={getExportDownloadUrl(runId, item.type, 'json', blind)}
              download
              className="px-2 py-1.5 font-mono text-indigo-600 hover:bg-indigo-50 transition-colors"
              title={`Download ${item.label} JSON`}
            >
              JSON
            </a>
          </div>
        ))}

        <a
          href={getExportDownloadUrl(runId, 'breakdown', 'zip', blind)}
          download
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-800 shadow-xs transition-colors"
          title="Download complete reproducible package with manifest.json, config.json, and results.csv"
        >
          <FileArchive size={14} /> Reproducible ZIP Bundle
        </a>
      </div>
    </div>
  );
}