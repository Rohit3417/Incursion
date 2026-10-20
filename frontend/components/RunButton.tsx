'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { runEvaluation } from '@/lib/api';
import { Play, Loader2 } from 'lucide-react';

interface RunButtonProps {
  datasetId: string | null;
  configId: string | null;
}

export default function RunButton({ datasetId, configId }: RunButtonProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRun = async () => {
    if (!datasetId || !configId) {
      setError('Please select/upload a dataset and save a configuration first.');
      return;
    }

    setIsRunning(true);
    setError('');
    try {
      const res = await runEvaluation(datasetId, configId);
      router.push(`/results?run_id=${res.run_id}`);
    } catch (err: any) {
      setError(err.message || 'Evaluation run failed');
      setIsRunning(false);
    }
  };

  const isDisabled = isRunning || !datasetId || !configId;

  return (
    <div className="flex flex-col items-end">
      {error && <p className="text-red-500 mb-2 text-xs font-medium">{error}</p>}
      <button
        type="button"
        onClick={handleRun}
        disabled={isDisabled}
        className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold text-sm shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        {isRunning ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} fill="currentColor" />}
        {isRunning ? 'Evaluating Candidates...' : 'Run Evaluation'}
      </button>
    </div>
  );
}