'use client';
import { useState, useEffect, useRef } from 'react';
import { ScoringConfig, TeamResult } from '@/lib/types';
import { recomputeLiveRank } from '@/lib/api';

export function useLiveRank(
  runId: string | null,
  initialConfig: ScoringConfig | null | undefined,
  baselineResults: TeamResult[]
) {
  const [config, setConfig] = useState<ScoringConfig | null>(initialConfig || null);
  const [liveResults, setLiveResults] = useState<TeamResult[]>(baselineResults);
  const [isReRanking, setIsReRanking] = useState(false);
  const [rankError, setRankError] = useState('');
  const isFirstRender = useRef(true);

  // Sync initial config when it arrives from parent
  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig]);

  // Sync baseline results when they arrive
  useEffect(() => {
    if (baselineResults && baselineResults.length > 0) {
      setLiveResults(baselineResults);
    }
  }, [baselineResults]);

  // Trigger debounced re-ranking on config change
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!runId || !config || !config.criteria) return;

    const totalWeight = config.criteria.reduce(
      (sum, c) => sum + Number(c.weight || 0),
      0
    );

    if (totalWeight !== 100) {
      setRankError(`Weights must sum to 100% (currently ${totalWeight}%)`);
      return;
    }

    setRankError('');
    const timer = setTimeout(async () => {
      setIsReRanking(true);
      try {
        const res = await recomputeLiveRank(runId, config);
        if (res && Array.isArray(res.data)) {
          setLiveResults(res.data);
        }
      } catch (err: any) {
        setRankError(err.message || 'Live re-ranking failed');
      } finally {
        setIsReRanking(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [runId, config]);

  const resetToBaseline = () => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
    setLiveResults(baselineResults);
    setRankError('');
  };

  return {
    config,
    setConfig,
    liveResults,
    isReRanking,
    rankError,
    resetToBaseline,
  };
}