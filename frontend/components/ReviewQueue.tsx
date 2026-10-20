'use client';
import WarningBadges, { BadgeItem } from './WarningBadges';
import StatusBadge from './StatusBadge';
import { TeamResult } from '@/lib/types';
import { AlertCircle, UserCheck } from 'lucide-react';

interface ReviewQueueProps {
  results: TeamResult[];
  onSelectTeam?: (team: TeamResult) => void;
}

export default function ReviewQueue({ results, onSelectTeam }: ReviewQueueProps) {
  const incompleteTeams = (results || []).filter(
    (r) =>
      r.status === 'Needs review' ||
      (r.missing_warnings && r.missing_warnings.length > 0) ||
      (r.failed_rules && r.failed_rules.length > 0)
  );

  if (incompleteTeams.length === 0) {
    return (
      <div className="p-12 text-center bg-white border rounded-xl text-gray-500 space-y-2">
        <UserCheck size={36} className="mx-auto text-green-500 mb-2" />
        <h3 className="text-base font-bold text-gray-800">All Clear: Review Queue Empty</h3>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          No candidates currently hold incomplete links, unverified claims, or rule ambiguities.
        </p>
      </div>
    );
  }

  const mapWarningsToBadges = (warnings: string[] | undefined, status: string): BadgeItem[] => {
    const badges: BadgeItem[] = [];
    if (status === 'Needs review') {
      badges.push({ type: 'NEEDS_REVIEW', tooltip: 'Flagged for human organizer review' });
    }
    for (const w of warnings || []) {
      const upper = w.toUpperCase();
      if (upper.includes('INVALID')) {
        badges.push({ type: 'INVALID', tooltip: w });
      } else if (upper.includes('UNCERTAIN')) {
        badges.push({ type: 'UNCERTAIN', tooltip: w });
      } else {
        badges.push({ type: 'MISSING', tooltip: w });
      }
    }
    return badges;
  };

  return (
    <div className="space-y-4">
      <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-xl text-xs text-amber-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle size={18} className="text-amber-700 shrink-0" />
          <span>
            Showing <strong>{incompleteTeams.length}</strong> team(s) requiring manual organizer review due to missing data, uncertain AI extraction, or edge cases.
          </span>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-xl bg-white shadow-xs">
        <table className="min-w-full divide-y divide-gray-200 text-xs">
          <thead className="bg-gray-50 text-gray-500 uppercase font-semibold">
            <tr>
              <th className="px-4 py-3 text-left">Team Name</th>
              <th className="px-4 py-3 text-left">Score</th>
              <th className="px-4 py-3 text-left">Current Status</th>
              <th className="px-4 py-3 text-left">Flags & Badges</th>
              <th className="px-4 py-3 text-left">Audit Explanation</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {incompleteTeams.map((team) => (
              <tr
                key={team.team_id}
                className="hover:bg-amber-50/30 transition-colors cursor-pointer"
                onClick={() => onSelectTeam && onSelectTeam(team)}
              >
                <td className="px-4 py-3 font-bold text-gray-900 whitespace-nowrap">
                  {team.team_name}
                </td>
                <td className="px-4 py-3 font-mono font-semibold text-gray-800">
                  {team.team_score?.toFixed(1) ?? '0.0'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <StatusBadge status={team.status} />
                </td>
                <td className="px-4 py-3">
                  <WarningBadges badges={mapWarningsToBadges(team.missing_warnings, team.status)} />
                </td>
                <td className="px-4 py-3 text-gray-600 max-w-sm truncate" title={team.explanation}>
                  {team.explanation || '—'}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTeam && onSelectTeam(team);
                    }}
                    className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
                  >
                    Inspect Evidence
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}