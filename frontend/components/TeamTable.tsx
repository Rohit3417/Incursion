import { Team, Member } from '@/lib/types';
import { Users, AlertCircle, CheckCircle2 } from 'lucide-react';

interface TeamTableProps {
  teams: Team[];
}

export default function TeamTable({ teams }: TeamTableProps) {
  if (!teams || teams.length === 0) return null;

  const hasMissingLinks = (member: Member) => {
    if (!member) return true;
    const vals = [member.github, member.resume, member.portfolio, member.linkedin];
    return vals.some((v) => !v || v === 'MISSING' || v === 'INVALID');
  };

  return (
    <div className="overflow-x-auto border rounded-xl bg-white shadow-xs">
      <table className="min-w-full divide-y divide-gray-200 text-xs">
        <thead className="bg-gray-50/80 text-gray-500 uppercase font-semibold">
          <tr>
            <th className="px-4 py-3 text-left">Team ID</th>
            <th className="px-4 py-3 text-left">Team Name</th>
            <th className="px-4 py-3 text-left">Roster Size</th>
            <th className="px-4 py-3 text-left">Data Completeness</th>
            <th className="px-4 py-3 text-left">Members</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {teams.map((team, i) => {
            const members = Array.isArray(team.members) ? team.members : [];
            const anyMissing = members.some(hasMissingLinks);

            return (
              <tr key={team.team_id || i} className="hover:bg-gray-50/60 transition-colors">
                <td className="px-4 py-3 font-mono font-bold text-gray-800">{team.team_id}</td>
                <td className="px-4 py-3 font-semibold text-gray-900">{team.team_name}</td>
                <td className="px-4 py-3 text-gray-600 font-mono">
                  <span className="inline-flex items-center gap-1">
                    <Users size={12} className="text-gray-400" />
                    {members.length} {members.length === 1 ? 'member' : 'members'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {anyMissing ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
                      <AlertCircle size={11} className="text-gray-500" /> Incomplete Links
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-green-50 text-green-700 border border-green-200">
                      <CheckCircle2 size={11} className="text-green-600" /> Complete
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={members.map((m) => m.name || m.email).join(', ')}>
                  {members.map((m) => m.name || m.email).join(', ') || '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}