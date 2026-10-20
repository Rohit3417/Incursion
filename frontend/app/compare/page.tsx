'use client';
import { useState, useEffect } from 'react';
import { getConfigs, listRuns, compareConfigurations } from '@/lib/api';
import { ConfigRecord, RunSummary, ConfigComparisonRow } from '@/lib/types';
import RankDelta from '@/components/RankDelta';
import StatusBadge from '@/components/StatusBadge';
import { GitCompare, ArrowRight, ArrowLeftRight, CheckCircle2 } from 'lucide-react';

export default function ComparePage() {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [configs, setConfigs] = useState<ConfigRecord[]>([]);
  const [selectedRunId, setSelectedRunId] = useState('');
  const [configAId, setConfigAId] = useState('');
  const [configBId, setConfigBId] = useState('');
  const [comparison, setComparison] = useState<ConfigComparisonRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([listRuns(), getConfigs()])
      .then(([runsRes, configsRes]) => {
        const rList = runsRes.data || [];
        const cList = configsRes.data || [];
        setRuns(rList);
        setConfigs(cList);

        if (rList.length > 0) setSelectedRunId(rList[0].id);
        if (cList.length > 0) setConfigAId(cList[0].id);
        if (cList.length > 1) setConfigBId(cList[1].id);
        else if (cList.length > 0) setConfigBId(cList[0].id);
      })
      .catch((err) => setError(err.message));
  }, []);

  const handleCompare = async () => {
    if (!selectedRunId || !configAId || !configBId) {
      setError('Please select a baseline run and two configurations.');
      return;
    }
    const cfgA = configs.find((c) => c.id === configAId)?.config_json;
    const cfgB = configs.find((c) => c.id === configBId)?.config_json;
    if (!cfgA || !cfgB) {
      setError('Selected configuration data is missing.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await compareConfigurations(selectedRunId, cfgA, cfgB);
      setComparison(res.comparison || []);
    } catch (err: any) {
      setError(err.message || 'Comparison request failed');
    } finally {
      setLoading(false);
    }
  };

  const statusChangesCount = comparison.filter((c) => c.status_changed).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="border-b pb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
          Step 4 of 5
        </span>
        <h2 className="text-2xl font-black text-gray-900 mt-2 flex items-center gap-2">
          Compare Scoring Strategies Side-by-Side
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Evaluate the exact same candidate dataset under two different configurations to measure rank sensitivity and status flips.
        </p>
      </div>

      {/* Selectors Bar */}
      <div className="bg-white p-5 border rounded-2xl shadow-xs grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
            Baseline Dataset Run
          </label>
          <select
            value={selectedRunId}
            onChange={(e) => setSelectedRunId(e.target.value)}
            className="w-full border p-2 rounded-lg text-xs font-semibold text-gray-800 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            {runs.length === 0 && <option value="">No runs available</option>}
            {runs.map((r) => (
              <option key={r.id} value={r.id}>
                Run {r.id.slice(0, 8)} ({new Date(r.created_at).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
            Strategy A (Baseline)
          </label>
          <select
            value={configAId}
            onChange={(e) => setConfigAId(e.target.value)}
            className="w-full border p-2 rounded-lg text-xs font-semibold text-gray-800 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            {configs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.is_preset ? '(Preset)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
            Strategy B (Challenger)
          </label>
          <select
            value={configBId}
            onChange={(e) => setConfigBId(e.target.value)}
            className="w-full border p-2 rounded-lg text-xs font-semibold text-gray-800 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            {configs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.is_preset ? '(Preset)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <button
            type="button"
            onClick={handleCompare}
            disabled={loading || !selectedRunId || !configAId || !configBId}
            className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-40 text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <GitCompare size={14} />
            {loading ? 'Evaluating Differences...' : 'Run Strategy Comparison'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 font-medium">
          {error}
        </div>
      )}

      {/* Results View */}
      {comparison.length > 0 && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between text-xs">
            <span className="text-indigo-900 font-medium">
              Comparison finished across <strong>{comparison.length}</strong> teams.
            </span>
            <span className="font-bold text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full">
              {statusChangesCount} Status Flips Detected
            </span>
          </div>

          <div className="overflow-x-auto bg-white border rounded-xl shadow-xs">
            <table className="min-w-full divide-y divide-gray-200 text-xs text-left">
              <thead className="bg-gray-50 text-gray-500 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Team Name</th>
                  <th className="px-4 py-3">Config A Rank (Score)</th>
                  <th className="px-4 py-3">Config B Rank (Score)</th>
                  <th className="px-4 py-3">Rank Shift</th>
                  <th className="px-4 py-3">Score Diff</th>
                  <th className="px-4 py-3">Status Transition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {comparison.map((row) => (
                  <tr
                    key={row.team_id}
                    className={`transition-colors ${
                      row.status_changed ? 'bg-amber-50/60 font-semibold' : 'hover:bg-gray-50/60'
                    }`}
                  >
                    <td className="px-4 py-3 text-gray-900 font-bold">{row.team_name}</td>
                    <td className="px-4 py-3 font-mono">
                      #{row.rank_a ?? '—'}{' '}
                      <span className="text-gray-400 font-normal">
                        ({row.score_a !== undefined ? row.score_a.toFixed(1) : '0.0'})
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      #{row.rank_b ?? '—'}{' '}
                      <span className="text-gray-400 font-normal">
                        ({row.score_b !== undefined ? row.score_b.toFixed(1) : '0.0'})
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <RankDelta delta={row.rank_diff} />
                    </td>
                    <td
                      className={`px-4 py-3 font-mono font-bold ${
                        row.score_diff > 0
                          ? 'text-green-600'
                          : row.score_diff < 0
                          ? 'text-red-600'
                          : 'text-gray-400'
                      }`}
                    >
                      {row.score_diff > 0 ? `+${row.score_diff.toFixed(1)}` : row.score_diff.toFixed(1)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <StatusBadge status={row.status_a} />
                        <ArrowRight size={12} className="text-gray-400 shrink-0" />
                        <StatusBadge status={row.status_b} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}