import { Users, Copy, AlertTriangle } from 'lucide-react';
import { UploadResponse } from '@/lib/types';

interface SummaryCardsProps {
  data: UploadResponse | null;
}

export default function SummaryCards({ data }: SummaryCardsProps) {
  if (!data) return null;

  const totalTeams = data.row_count || 0;
  const duplicateTeamsCount = data.validation_report?.duplicate_teams?.length || 0;
  const missingLinksCount = data.validation_report?.missing_links_count || 0;
  const invalidLinksCount = data.validation_report?.invalid_links_count || 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div className="bg-white p-4 border rounded-xl shadow-xs flex items-center gap-3.5">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
          <Users size={22} />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase">Total Teams Loaded</h4>
          <p className="text-2xl font-extrabold text-gray-900 font-mono">{totalTeams}</p>
        </div>
      </div>

      <div className="bg-white p-4 border rounded-xl shadow-xs flex items-center gap-3.5">
        <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
          <Copy size={22} />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase">Duplicate Teams</h4>
          <p className="text-2xl font-extrabold text-amber-600 font-mono">{duplicateTeamsCount}</p>
        </div>
      </div>

      <div className="bg-white p-4 border rounded-xl shadow-xs flex items-center gap-3.5">
        <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
          <AlertTriangle size={22} />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase">Missing / Invalid Links</h4>
          <p className="text-2xl font-extrabold text-rose-600 font-mono">
            {missingLinksCount}
            {invalidLinksCount > 0 && (
              <span className="text-xs font-normal text-rose-400 ml-1.5">
                ({invalidLinksCount} invalid)
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}