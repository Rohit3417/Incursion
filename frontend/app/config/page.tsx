'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CriteriaList from '@/components/CriteriaList';
import WeightSliders from '@/components/WeightSliders';
import PresetPicker from '@/components/PresetPicker';
import RunButton from '@/components/RunButton';
import { getConfigs, saveConfig } from '@/lib/api';
import { ScoringConfig, ConfigRecord } from '@/lib/types';
import { Sliders, Settings2, Save, ArrowLeft, CheckCircle2 } from 'lucide-react';

const DEFAULT_CONFIG: ScoringConfig = {
  criteria: [
    { name: 'Technical Skills', weight: 20, keywords: ['python', 'react', 'fastapi'] },
    { name: 'Projects and Experience', weight: 25, keywords: [] },
    { name: 'GitHub Activity', weight: 20, keywords: [] },
    { name: 'Achievements', weight: 15, keywords: [] },
    { name: 'Portfolio', weight: 20, keywords: [] },
  ],
  eligibility_rules: [],
  top_x: 10,
  aggregation: 'mean',
  missing_policy: 'redistribute',
  tie_break: ['team_score', 'team_id'],
};

export default function ConfigPage() {
  const [config, setConfig] = useState<ScoringConfig>(DEFAULT_CONFIG);
  const [configName, setConfigName] = useState('Balanced Default Strategy');
  const [presets, setPresets] = useState<ConfigRecord[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [configId, setConfigId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const storedDatasetId = localStorage.getItem('current_dataset_id');
    if (!storedDatasetId) {
      router.push('/upload');
      return;
    }
    setDatasetId(storedDatasetId);
    setConfigId(localStorage.getItem('current_config_id'));

    getConfigs()
      .then((res) => {
        const pList = (res.data || []).filter((c) => c.is_preset);
        setPresets(pList);
        if (pList.length > 0 && !localStorage.getItem('current_config_id')) {
          setConfig(pList[0].config_json);
          setConfigName(pList[0].name);
          setSelectedPresetId(pList[0].id);
          setConfigId(pList[0].id);
          localStorage.setItem('current_config_id', pList[0].id);
        }
      })
      .catch((err) => setError(err.message));
  }, [router]);

  const handleSelectPreset = (presetConfig: ScoringConfig, name: string) => {
    setConfig(presetConfig);
    setConfigName(name);
    setSaveSuccess(false);
    // Find preset ID
    const found = presets.find((p) => p.name === name);
    if (found) {
      setSelectedPresetId(found.id);
      setConfigId(found.id);
      localStorage.setItem('current_config_id', found.id);
    }
  };

  const handleSave = async () => {
    const totalWeight = config.criteria.reduce((s, c) => s + Number(c.weight || 0), 0);
    if (totalWeight !== 100) {
      setError(`Weights must equal 100% before saving (currently ${totalWeight}%).`);
      return;
    }

    try {
      setError('');
      setIsSaving(true);
      const res = await saveConfig(configName.trim(), config, false);
      const savedId = res.data.id;
      setConfigId(savedId);
      localStorage.setItem('current_config_id', savedId);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
            Step 2 of 5
          </span>
          <h2 className="text-2xl font-black text-gray-900 mt-2">
            Configure Scoring Dimensions & Strategy
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Set criteria weights, keywords, missing-data redistribution policies, and Top-X shortlisting cutoffs.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => router.push('/upload')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            <ArrowLeft size={14} /> Back to Upload
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 font-medium">
          {error}
        </div>
      )}

      {saveSuccess && (
        <div className="p-3.5 bg-green-50 text-green-800 text-xs rounded-xl border border-green-200 font-medium flex items-center gap-2">
          <CheckCircle2 size={16} className="text-green-600" />
          <span>Strategy configuration saved successfully! You can now run the deterministic evaluation.</span>
        </div>
      )}

      {/* Preset Picker */}
      <PresetPicker
        presets={presets}
        onSelect={handleSelectPreset}
        selectedPresetId={selectedPresetId}
      />

      {/* Configuration Form Bar */}
      <div className="bg-white p-4 border rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
            Strategy Configuration Name
          </label>
          <input
            type="text"
            value={configName}
            onChange={(e) => {
              setConfigName(e.target.value);
              setSaveSuccess(false);
            }}
            placeholder="e.g., Hackathon Balanced Default"
            className="w-full border rounded-lg px-3 py-2 text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        <div className="sm:self-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !configName.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save size={15} /> {isSaving ? 'Saving...' : 'Save Strategy'}
          </button>
        </div>
      </div>

      {/* Criteria & Sliders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <CriteriaList
            criteria={config.criteria}
            onUpdate={(c) => setConfig({ ...config, criteria: c })}
            onRemove={(idx) => {
              const updated = config.criteria.filter((_, i) => i !== idx);
              setConfig({ ...config, criteria: updated });
            }}
          />
        </div>

        <div className="space-y-6">
          <WeightSliders
            criteria={config.criteria}
            onUpdate={(c) => setConfig({ ...config, criteria: c })}
          />

          {/* Engine Parameters Card */}
          <div className="bg-white p-4 border rounded-xl shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-gray-800 uppercase flex items-center gap-1.5 border-b pb-2">
              <Settings2 size={15} className="text-indigo-600" /> Advanced Engine Settings
            </h4>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-600 font-medium mb-1">Top-X Shortlist Cutoff:</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={config.top_x || 10}
                  onChange={(e) =>
                    setConfig({ ...config, top_x: Math.max(1, Number(e.target.value)) })
                  }
                  className="w-full border rounded-md px-2.5 py-1.5 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-gray-600 font-medium mb-1">Missing-Data Policy:</label>
                <select
                  value={config.missing_policy || 'redistribute'}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      missing_policy: e.target.value as 'redistribute' | 'neutral' | 'penalty',
                    })
                  }
                  className="w-full border rounded-md px-2.5 py-1.5 text-xs bg-white"
                >
                  <option value="redistribute">Redistribute weight to present criteria</option>
                  <option value="neutral">Neutral (assign average score of present criteria)</option>
                  <option value="penalty">Penalty (score 0 for missing dimensions)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-600 font-medium mb-1">Aggregation Method:</label>
                <select
                  value={config.aggregation || 'mean'}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      aggregation: e.target.value as 'mean' | 'highest_member' | 'weighted_mean',
                    })
                  }
                  className="w-full border rounded-md px-2.5 py-1.5 text-xs bg-white"
                >
                  <option value="mean">Arithmetic Mean of Member Scores</option>
                  <option value="highest_member">Highest Member Score</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Execution Action Footer */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
        <div>
          <h4 className="text-sm font-bold">Ready to Run Evaluation</h4>
          <p className="text-xs text-slate-400 mt-0.5">
            The engine will compute deterministic SHA-256 run hashes and generate explainable breakdowns.
          </p>
        </div>
        <RunButton datasetId={datasetId} configId={configId} />
      </div>
    </div>
  );
}
