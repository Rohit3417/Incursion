'use client';
import { X, CheckCircle2, XCircle, AlertTriangle, Code2, Award, ArrowUpRight } from 'lucide-react';
import StatusBadge from './StatusBadge';
import ScoreBreakdown from './ScoreBreakdown';
import { TeamResult } from '@/lib/types';

interface TeamDrawerProps {
  team: TeamResult | null;
  onClose: () => void;
}

export default function TeamDrawer({ team, onClose }: TeamDrawerProps) {
  if (!team) return null;

  const details = team.explanation_details || {};
  const failedRules = team.failed_rules || details.failed_eligibility_rules || [];
  const warnings = team.missing_warnings || details.missing_warnings || [];
  const breakdown = team.criterion_breakdown || {};
  const memberValues = team._member_criterion_values || {};

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-2xs transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white h-full shadow-2xl overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between border-b pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-semibold">
                  Team ID: {team.team_id}
                </span>
                {team.override_action && (
                  <span className="text-[11px] font-mono uppercase bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold">
                    Override: {team.override_action}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 mt-1">{team.team_name}</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Score & Cutoff Banner */}
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <p className="text-[11px] text-gray-500 uppercase font-bold tracking-wider">
                Total Team Score
              </p>
              <p className="text-3xl font-black font-mono text-blue-600">
                {team.team_score !== undefined ? team.team_score.toFixed(1) : '0.0'}
              </p>
            </div>
            <div className="text-right space-y-1.5">
              <div>
                <StatusBadge status={team.status} />
              </div>
              {details.gap_to_cutoff !== undefined && (
                <p className="text-xs text-gray-600 font-medium">
                  Cutoff Gap:{' '}
                  <span
                    className={`font-mono font-bold ${
                      details.gap_to_cutoff >= 0 ? 'text-green-600' : 'text-rose-600'
                    }`}
                  >
                    {details.gap_to_cutoff >= 0 ? `+${details.gap_to_cutoff}` : details.gap_to_cutoff} pts
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Deterministic Evaluation Explanation */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 text-xs text-blue-950 space-y-2">
            <h4 className="font-bold flex items-center gap-1.5 text-blue-900 text-sm">
              <Award size={16} className="text-blue-700" /> Deterministic Audit Explanation
            </h4>
            <p className="leading-relaxed text-gray-800">
              {team.explanation || 'No automated explanation summary available.'}
            </p>
            {details.top_two_strengths && details.top_two_strengths.length > 0 && (
              <div className="pt-2 border-t border-blue-200/60 text-xs text-blue-800 space-y-0.5">
                <p>
                  <strong>Key Strengths:</strong> {details.top_two_strengths.join(' & ')}
                </p>
                {details.weakest_criterion && (
                  <p className="text-gray-600">
                    <strong>Weakest Area:</strong> {details.weakest_criterion}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Criterion Breakdown Bars */}
          <div className="border rounded-xl overflow-hidden shadow-2xs">
            <ScoreBreakdown breakdown={breakdown} teamScore={team.team_score || 0} />
          </div>

          {/* Eligibility Rules Check */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Eligibility Rules Verification
            </h4>
            {failedRules.length === 0 ? (
              <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-3 rounded-lg font-medium">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>All mandatory eligibility and team composition rules passed.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {failedRules.map((fr: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs bg-red-50 border border-red-200 text-red-900 p-3 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <XCircle size={16} className="text-red-600 shrink-0" />
                      <div>
                        <p className="font-bold">
                          Failed Rule: {fr.rule?.signal} {fr.rule?.operator} {fr.rule?.value}
                        </p>
                        <p className="text-gray-500 text-[11px]">Scope: {fr.rule?.scope}</p>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold bg-white px-2 py-0.5 rounded border border-red-200">
                      Actual: {String(fr.actual_value)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Warnings & Incomplete Signals */}
          {warnings.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Audit Warnings & Data Flags ({warnings.length})
              </h4>
              <ul className="space-y-1.5 text-xs text-amber-900 bg-amber-50/80 border border-amber-200 p-3 rounded-lg">
                {warnings.map((w: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Member Criterion Evidence */}
          {Object.keys(memberValues).length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <Code2 size={15} className="text-gray-600" />
                Extracted Member Signals & Proof
              </h4>
              <div className="space-y-2">
                {Object.entries(memberValues).map(([memberKey, crits]: [string, any]) => (
                  <div key={memberKey} className="p-3 bg-gray-50 rounded-lg border text-xs space-y-2">
                    <p className="font-mono font-bold text-gray-800 truncate" title={memberKey}>
                      Candidate: {memberKey}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      {Object.entries(crits || {}).map(([cName, cVal]: [string, any]) => (
                        <div
                          key={cName}
                          className="flex justify-between bg-white px-2 py-1 rounded border border-gray-200"
                        >
                          <span className="text-gray-500 truncate mr-1" title={cName}>
                            {cName}:
                          </span>
                          <span className="font-mono font-bold text-gray-900">
                            {typeof cVal === 'number' ? cVal.toFixed(1) : String(cVal)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Close Detail Drawer
          </button>
        </div>
      </div>
    </div>
  );
}