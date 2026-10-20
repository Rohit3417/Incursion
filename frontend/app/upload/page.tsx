'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UploadBox from '@/components/UploadBox';
import SummaryCards from '@/components/SummaryCards';
import ValidationPanel from '@/components/ValidationPanel';
import DataPreview from '@/components/DataPreview';
import { uploadDataset } from '@/lib/api';
import { UploadResponse } from '@/lib/types';
import { ArrowRight, RotateCcw, FileText, CheckCircle2 } from 'lucide-react';

export default function UploadPage() {
  const [uploadData, setUploadData] = useState<UploadResponse | null>(null);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const router = useRouter();

  // Load any previously uploaded dataset id from localStorage if available
  useEffect(() => {
    const savedId = localStorage.getItem('current_dataset_id');
    const savedName = localStorage.getItem('current_dataset_name');
    if (savedName) setFileName(savedName);
  }, []);

  const handleUpload = async (file: File) => {
    try {
      setError('');
      setFileName(file.name);
      const data = await uploadDataset(file);
      setUploadData(data);
      localStorage.setItem('current_dataset_id', data.dataset_id);
      localStorage.setItem('current_dataset_name', file.name);
    } catch (err: any) {
      setError(err.message || 'File upload failed');
    }
  };

  const handleReset = () => {
    setUploadData(null);
    setFileName('');
    localStorage.removeItem('current_dataset_id');
    localStorage.removeItem('current_dataset_name');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
            Step 1 of 5
          </span>
          <h2 className="text-2xl font-black text-gray-900 mt-2">
            Upload & Ingest Registration Data
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Import candidate registrations in CSV or JSON format. Evaluates completeness, detects duplicate candidates, and parses links.
          </p>
        </div>

        {uploadData && (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer self-start sm:self-auto"
          >
            <RotateCcw size={13} /> Upload Different File
          </button>
        )}
      </div>

      {/* Upload Zone */}
      {!uploadData && (
        <div className="bg-white p-6 rounded-2xl border shadow-xs space-y-4">
          <UploadBox onFileSelect={handleUpload} />
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 text-center font-medium">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Uploaded State */}
      {uploadData && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Active File Banner */}
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-indigo-900 font-medium">
              <FileText size={16} className="text-indigo-600" />
              <span>
                Active Dataset: <strong className="font-mono">{fileName || 'Uploaded Dataset'}</strong> (ID:{' '}
                <span className="font-mono">{uploadData.dataset_id?.slice(0, 8)}...</span>)
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
              <CheckCircle2 size={12} /> Ingested Successfully
            </span>
          </div>

          {/* Metric Cards */}
          <SummaryCards data={uploadData} />

          {/* Validation Warnings & Errors */}
          <ValidationPanel report={uploadData.validation_report} />

          {/* Action Bar & Preview */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div>
              <h3 className="text-base font-bold text-gray-900">Parsed Candidate Records</h3>
              <p className="text-xs text-gray-500">
                Inspect raw parsed columns and member data before proceeding to the scoring configuration.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push('/config')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-bold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
            >
              Configure Scoring Strategy <ArrowRight size={15} />
            </button>
          </div>

          <DataPreview previewData={uploadData.preview} />
        </div>
      )}
    </div>
  );
}
