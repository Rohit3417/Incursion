'use client';
import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import ScoreBreakdown from './ScoreBreakdown';
import OverrideButtons from './OverrideButtons';
import RankDelta from './RankDelta';
import { AlertTriangle, ChevronDown, ChevronRight, Eye, ChevronLeft, Search } from 'lucide-react';
import { TeamResult } from '@/lib/types';

interface ResultsTableProps {
  results: TeamResult[];
  runId?: string | null;
  onRefresh?: () => void;
  onSelectTeam?: (team: TeamResult) => void;
  pageSize?: number;
}

export default function ResultsTable({
  results,
  runId,
  onRefresh,
  onSelectTeam,
  pageSize = 20,
}: ResultsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredResults = (results || []).filter((r) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      (r.team_name && r.team_name.toLowerCase().includes(query)) ||
      (r.team_id && r.team_id.toLowerCase().includes(query)) ||
      (r.status && r.status.toLowerCase().includes(query))
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredResults.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedRows = filteredResults.slice(startIndex, startIndex + pageSize);

  const toggleRow = (teamId: string) => {
    const next = new Set(expandedRows);
    if (next.has(teamId)) next.delete(teamId);
    else next.add(teamId);
    setExpandedRows(next);
  };

  return (
    <div className="space-y-3">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border shadow-2xs">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search team name, ID, or status..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div className="text-xs text-gray-500 font-medium self-end sm:self-center">
          Showing <strong className="text-gray-900">{filteredResults.length}</strong> of{' '}
          <strong className="text-gray-900">{results.length}</strong> teams
        </div>
      </div>

      {filteredResults.length === 0 ? (
        <div className="p-12 text-center bg-white border rounded-xl text-gray-500 text-xs">
          No teams match your search or selected filter.
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-xl bg-white shadow-xs">
          <table className="min-w-full divide-y divide-gray-200 text-xs text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase font-semibold">
              <tr>
                <th className="px-3 py-3 w-8"></th>
                <th className="px-4 py-3">Final Rank</th>
                <th className="px-4 py-3">Shift</th>
                <th className="px-4 py-3">Team Name</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Warnings</th>
                {runId && <th className="px-4 py-3">Manual Override</th>}
                <th className="px-4 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {paginatedRows.map((row) => {
                const isExpanded = expandedRows.has(row.team_id);
                const finalRank = row.final_rank !== undefined ? row.final_rank : row.rank;
                const autoRank = row.automated_rank !== undefined ? row.automated_rank : row.rank;
                const warningsCount = row.missing_warnings?.length || 0;

                const rowHighlight = row.entered_top_x
                  ? 'bg-emerald-50/50'
                  : row.left_top_x
                  ? 'bg-rose-50/50'
                  : 'hover:bg-gray-50/70';

                return (
                  <React.Fragment key={row.team_id}>
                    <tr
                      tabIndex={0}
                      onClick={() => toggleRow(row.team_id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleRow(row.team_id);
                        }
                      }}
                      className={`cursor-pointer transition-colors ${rowHighlight}`}
                    >
                      <td className="px-3 py-3 text-gray-400">
                        {isExpanded ? (
                          <ChevronDown size={15} className="text-gray-700" />
                        ) : (
                          <ChevronRight size={15} />
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-gray-900 whitespace-nowrap">
                        {finalRank !== null && finalRank !== undefined ? `#${finalRank}` : '—'}
                        {autoRank && autoRank !== finalRank && (
                          <span className="ml-1.5 text-[10px] font-normal text-gray-400 font-mono">
                            (Auto #{autoRank})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <RankDelta
                          delta={row.rank_delta}
                          enteredTopX={row.entered_top_x}
                          leftTopX={row.left_top_x}
                        />
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900">
                        <div className="flex items-center gap-2">
                          <span>{row.team_name}</span>
                          {row.override_action && (
                            <span
                              title={`Reason: ${row.override_reason || 'Manual override'}`}
                              className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-indigo-100 text-indigo-800 border border-indigo-200"
                            >
                              {row.override_action}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-gray-800">
                        {row.team_score !== undefined ? row.team_score.toFixed(1) : '0.0'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {warningsCount > 0 && (
                          <div
                            className="inline-flex items-center text-amber-700 text-xs font-semibold gap-1"
                            title={row.missing_warnings?.join(' | ')}
                          >
                            <AlertTriangle size={14} className="text-amber-600" />
                            <span>{warningsCount}</span>
                          </div>
                        )}
                      </td>
                      {runId && (
                        <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <OverrideButtons
                            runId={runId}
                            teamId={row.team_id}
                            teamName={row.team_name}
                            currentAction={row.override_action}
                            onOverrideSuccess={onRefresh}
                          />
                        </td>
                      )}
                      <td className="px-4 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onSelectTeam && onSelectTeam(row)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors"
                        >
                          <Eye size={12} /> Inspect
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={runId ? 9 : 8} className="p-0 border-b border-gray-200 bg-gray-50/50">
                          <ScoreBreakdown
                            breakdown={row.criterion_breakdown || {}}
                            teamScore={row.team_score || 0}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white px-4 py-3 border rounded-xl text-xs">
          <span className="text-gray-600">
            Showing <strong>{startIndex + 1}</strong> to{' '}
            <strong>{Math.min(startIndex + pageSize, filteredResults.length)}</strong> of{' '}
            <strong>{filteredResults.length}</strong> teams
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="inline-flex items-center gap-1 px-2.5 py-1 border rounded bg-white hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft size={13} /> Prev
            </button>
            <span className="font-mono text-xs px-2 font-semibold">
              {safePage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="inline-flex items-center gap-1 px-2.5 py-1 border rounded bg-white hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
            >
              Next <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}