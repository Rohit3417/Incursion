'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { listRuns, verifyRunReproducibility } from '@/lib/api';
import { RunSummary, VerificationResult } from '@/lib/types';
import { ShieldCheck, ShieldAlert, ExternalLink, Loader2, RefreshCw, History, CheckCircle2 } from 'lucide-react';
import ExportBar from '@/components/ExportBar';

export default function HistoryPage() {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [verifyState, setVerifyState] = useState<Record<string, { loading?: boolean; result?: VerificationResult; error?: string }>>({});
  const [selectedRunForExport, setSelectedRunForExport] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRuns = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await listRuns();
      const data = res.data || [];
      setRuns(data);
      if (data.length > 0 && !selectedRunForExport) {
        setSelectedRunForExport(data[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch historical evaluation runs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRuns();
  }, []);

  const handleVerify = async (runId: string) => {
    setVerifyState((prev) => ({ ...prev, [runId]: { loading: true } }));
    try {
      const result = await verifyRunReproducibility(runId);
      setVerifyState((prev) => ({ ...prev, [runId]: { loading: false, result } }));
    } catch (err: any) {
      setVerifyState((prev) => ({ ...prev, [runId]: { loading: false, error: err.message } }));
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
            Step 5 of 5
          </span>
          <h2 className="text-2xl font-black text-gray-900 mt-2 flex items-center gap-2">
            Audit Trail & Cryptographic Reproducibility
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Every evaluation run is pinned by a deterministic SHA-256 hash computed canonically from input dataset and scoring configuration.
          </p>
        </div>

        <button
          type="button"
          onClick={loadRuns}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer self-start sm:self-auto shadow-2xs"
        >
          <RefreshCw size={13} /> Refresh Log
        </button>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 font-medium">
          {error}
        </div>
      )}

      {/* Selected Run Export Bar */}
      {selectedRunForExport && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500 px-1">
            <span>
              Exporting results for selected run:{' '}
              <strong className="font-mono text-gray-800">{selectedRunForExport.slice(0, 8)}...</strong>
            </span>
          </div>
          <ExportBar runId={selectedRunForExport} />
        </div>
      )}

      {/* Runs Table */}
      {loading ? (
        <div className="p-12 text-center text-gray-500 text-xs flex items-center justify-center gap-2 bg-white border rounded-2xl">
          <Loader2 size={18} className="animate-spin text-indigo-600" />
          <span>Fetching evaluation runs from repository...</span>
        </div>
      ) : runs.length === 0 ? (
        <div className="p-12 text-center bg-white border rounded-2xl text-gray-500 space-y-2">
          <History size={36} className="mx-auto text-gray-400 mb-2" />
          <h3 className="text-base font-bold text-gray-800">No Evaluation Runs Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            You have not run any candidate evaluations yet. Upload a dataset in Step 1 to begin.
          </p>
        </div>
      ) : (
        <div className="bg-white border rounded-2xl shadow-xs overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-xs text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Run ID</th>
                <th className="px-4 py-3">Dataset ID</th>
                <th className="px-4 py-3">Run Hash (SHA-256)</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Deterministic Verification</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {runs.map((run) => {
                const v = verifyState[run.id];
                const isSelected = selectedRunForExport === run.id;

                return (
                  <tr
                    key={run.id}
                    onClick={() => setSelectedRunForExport(run.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-50/60 font-semibold' : 'hover:bg-gray-50/70'
                    }`}
                  >
                    <td className="px-4 py-3 font-mono font-bold text-gray-900">
                      {run.id.slice(0, 8)}...
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-500 text-[11px]">
                      {run.dataset_id ? `${run.dataset_id.slice(0, 8)}...` : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-gray-600 truncate max-w-[200px]" title={run.run_hash}>
                      {run.run_hash}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {new Date(run.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {!v ? (
                        <button
                          type="button"
                          onClick={() => handleVerify(run.id)}
                          className="px-2.5 py-1 text-[11px] font-semibold border rounded-md bg-white hover:bg-gray-100 text-gray-700 shadow-2xs transition-colors cursor-pointer"
                        >
                          Verify Hash
                        </button>
                      ) : v.loading ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-indigo-600 font-medium">
                          <Loader2 size={13} className="animate-spin" /> Verifying...
                        </span>
                      ) : v.result?.matches ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <ShieldCheck size={13} className="text-emerald-600" /> Verified Deterministic
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                          <ShieldAlert size={13} className="text-rose-600" /> Hash Mismatch
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/results?run_id=${run.id}`}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-bold"
                      >
                        Open Results <ExternalLink size={12} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
