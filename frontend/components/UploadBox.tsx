'use client';
import { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, Loader2 } from 'lucide-react';

interface UploadBoxProps {
  onFileSelect: (file: File) => Promise<void> | void;
}

export default function UploadBox({ onFileSelect }: UploadBoxProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    try {
      await onFileSelect(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
        isDragOver
          ? 'border-indigo-500 bg-indigo-50/50 scale-[1.005]'
          : 'border-gray-300 hover:border-gray-400 bg-gray-50/40 hover:bg-gray-50'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.json"
        onChange={handleFileChange}
        className="hidden"
        id="file-upload-input"
      />

      <div className="flex flex-col items-center max-w-md mx-auto space-y-3">
        <div className="p-4 bg-white rounded-2xl shadow-xs border border-gray-100 text-indigo-600">
          {isUploading ? (
            <Loader2 size={36} className="animate-spin text-indigo-600" />
          ) : (
            <UploadCloud size={36} />
          )}
        </div>

        <div>
          <h3 className="text-base font-bold text-gray-900">
            {isUploading ? 'Validating Dataset...' : 'Upload Hackathon Registration Data'}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Drag and drop CSV or JSON export from Google Forms, Devpost, or Typeform (up to 10MB).
          </p>
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 shadow-xs transition-all disabled:opacity-50"
        >
          <FileSpreadsheet size={15} />
          {isUploading ? 'Parsing Teams...' : 'Browse Local Files'}
        </button>
      </div>
    </div>
  );
}