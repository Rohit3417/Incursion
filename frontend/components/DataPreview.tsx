'use client';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Table } from 'lucide-react';

interface DataPreviewProps {
  previewData: Record<string, any>[];
  pageSize?: number;
}

export default function DataPreview({ previewData, pageSize = 8 }: DataPreviewProps) {
  const [currentPage, setCurrentPage] = useState(1);

  if (!previewData || previewData.length === 0) return null;

  const headers = Object.keys(previewData[0]);
  const totalPages = Math.ceil(previewData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const currentRows = previewData.slice(startIndex, startIndex + pageSize);

  const formatCellValue = (val: any) => {
    if (val === null || val === undefined || val === '') {
      return <span className="text-gray-300 italic">—</span>;
    }
    if (typeof val === 'object') {
      return <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{JSON.stringify(val)}</code>;
    }
    const str = String(val);
    if (str.startsWith('http://') || str.startsWith('https://')) {
      return (
        <a
          href={str}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline truncate max-w-[200px] inline-block font-mono text-xs"
        >
          {str}
        </a>
      );
    }
    return str;
  };

  return (
    <div className="bg-white border rounded-xl shadow-xs overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between bg-gray-50/70">
        <div className="flex items-center gap-2">
          <Table size={16} className="text-gray-500" />
          <h3 className="text-sm font-bold text-gray-800">Uploaded Data Preview</h3>
          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-mono font-medium">
            First {previewData.length} Rows
          </span>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded border bg-white hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded border bg-white hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-xs text-left">
          <thead className="bg-gray-50 text-gray-600 uppercase font-semibold">
            <tr>
              {headers.map((h) => (
                <th key={h} className="px-4 py-2.5 whitespace-nowrap">
                  {h.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {currentRows.map((row, i) => (
              <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                {headers.map((h) => (
                  <td key={h} className="px-4 py-2.5 whitespace-nowrap text-gray-800">
                    {formatCellValue(row[h])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}