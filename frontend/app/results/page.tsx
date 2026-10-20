'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ResultsTable from '@/components/ResultsTable';
import ReviewQueue from '@/components/ReviewQueue';
import WhatIfPanel from '@/components/WhatIfPanel';
import ExportBar from '@/components/ExportBar';
import BlindToggle from '@/components/BlindToggle';
import TeamDrawer from '@/components/TeamDrawer';
import { getRun, getFinalRunOrder } from '@/lib/api';
import { useLiveRank } from '@/hooks/useLiveRank';
import { RunRecord, TeamResult } from '@/lib/types';
import { Award, Hash, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';

function ResultsContent() {
  const searchParams = useSearchParams();
  const runId = searchParams.get('run_id');
  const router = useRouter();

  const [runData, setRunData] = useState<RunRecord | null>(null);
  const [finalRows, setFinalRows] = useState<TeamResult[]>([]);
  const [blindMode, setBlindMode] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamResult | null>(null);
  const [activeTab, setActiveTab] = useState('All');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadRunDetails = useCallback(async () => {
    if (!runId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const [runRes, finalRes] = await Promise.all([
        getRun(runId),
        getFinalRunOrder(runId),
      ]);
      setRunData(runRes.data);
      const rows = finalRes.data && finalRes.data.length > 0 ? finalRes.data : runRes.data?.results_json || [];
      setFinalRows(rows);
    } catch (err: any) {
      setError(err.message || 'Failed to load evaluation run');
    } finally {
      setLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    loadRunDetails();
  }, [loadRunDetails]);

  const {
    config,
    setConfig,
    liveResults,
    isReRanking,
    rankError,
    resetToBaseline,
  } = useLiveRank(runId, runData?.config_snapshot_json, finalRows);

  // Blind Mode: anonymize candidate teams into deterministic hashes if enabled
  const displayedResults: TeamResult[] = (liveResults || []).map((r, i) => {
    if (!blindMode) return r;
    const cleanId = String(r.team_id || i + 1).slice(-4).toUpperCase();
    return {
      ...r,
      team_name: `Blind Team #TM-${cleanId}`,
    };
  });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-12 text-center space-y-3">
        <RefreshCw size={28} className="animate-spin mx-auto text-indigo-600" />
        <h3 className="text-base font-bold text-gray-800">Computing Results & Signals...</h3>
        <p className="text-xs text-gray-500">Loading audit trail and evaluation run data from repository.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-8 bg-red-50 border border-red-200 rounded-2xl space-y-3">
        <div className="flex items-center gap-2 text-red-800 font-bold text-base">
          <AlertCircle size={20} /> Failed to Load Evaluation Run
        </div>
        <p className="text-xs text-red-600">{error}</p>
        <button
          onClick={() => router.push('/config')}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 cursor-pointer"
        >
          Return to Configure
        </button>
      </div>
    );
  }

  if (!runId || !runData) {
    return (
      <div className="max-w-5xl mx-auto p-12 text-center bg-white border rounded-2xl shadow-xs space-y-4">
        <Award size={36} className="mx-auto text-gray-400" />
        <h3 className="text-lg font-bold text-gray-800">No Active Evaluation Run Selected</h3>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          Please upload a registration dataset in Step 1 and run an evaluation in Step 2 to generate rankings.
        </p>
        <button
          onClick={() => router.push('/upload')}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 cursor-pointer"
        >
          Go to Step 1: Upload
        </button>
      </div>
    );
  }

  const tabs = [
    'All',
    'Shortlisted',
    'Not shortlisted',
    'Needs review',
    'Ineligible',
    'Needs review queue',
  ];

  const filteredResults =
    activeTab === 'All' || activeTab === 'Needs review queue'
      ? displayedResults
      : displayedResults.filter((r) => {
          if (!r.status) return false;
          return r.status.toLowerCase().startsWith(activeTab.toLowerCase());
        });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Run Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
              Step 3 of 5
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200">
              <Hash size={12} /> Run {runId.slice(0, 8)}
            </span>
          </div>
          <h2 className="text-2xl font-black text-gray-900 mt-2 flex items-center gap-2">
            Deterministic Evaluation Results
          </h2>
          <p className="text-xs text-gray-500 font-mono mt-0.5">
            Cryptographic SHA-256 Hash: <strong className="text-gray-800">{runData.run_hash}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          <BlindToggle blind={blindMode} onChange={setBlindMode} />
          <button
            type="button"
            onClick={loadRunDetails}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer shadow-2xs"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Export Bar */}
      <ExportBar runId={runId} blind={blindMode} />

      {/* What-If Live Simulator */}
      {config && (
        <WhatIfPanel
          config={config}
          onChange={setConfig}
          onReset={resetToBaseline}
          isReRanking={isReRanking}
          rankError={rankError}
        />
      )}

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-3">
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          let count = 0;
          if (tab === 'All') count = displayedResults.length;
          else if (tab === 'Needs review queue')
            count = displayedResults.filter(
              (r) =>
                r.status === 'Needs review' ||
                (r.missing_warnings && r.missing_warnings.length > 0)
            ).length;
          else
            count = displayedResults.filter((r) =>
              r.status?.toLowerCase().startsWith(tab.toLowerCase())
            ).length;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <span>{tab}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Tab View */}
      {activeTab === 'Needs review queue' ? (
        <ReviewQueue results={displayedResults} onSelectTeam={setSelectedTeam} />
      ) : (
        <ResultsTable
          results={filteredResults}
          runId={runId}
          onRefresh={loadRunDetails}
          onSelectTeam={setSelectedTeam}
        />
      )}

      {/* Team Detail Drawer */}
      <TeamDrawer team={selectedTeam} onClose={() => setSelectedTeam(null)} />
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto p-12 text-center text-gray-500 text-xs">
          Loading evaluation results...
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
