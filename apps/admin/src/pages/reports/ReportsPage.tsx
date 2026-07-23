import React, { useState } from 'react';
import { adminApi } from '../../services/api';

type ReportType = 'chats' | 'leads' | 'visitors' | 'knowledge' | 'faq' | 'inquiries';

const reportTypes: Array<{ value: ReportType; label: string; description: string }> = [
  { value: 'chats', label: 'Chat Reports', description: 'Conversation details and metrics' },
  { value: 'leads', label: 'Lead Reports', description: 'Captured leads and contact info' },
  { value: 'visitors', label: 'Visitor Reports', description: 'Daily visitor statistics' },
  { value: 'knowledge', label: 'Knowledge Reports', description: 'Knowledge base articles' },
  { value: 'faq', label: 'FAQ Reports', description: 'FAQ items and usage' },
  { value: 'inquiries', label: 'Inquiry Reports', description: 'All inquiries and status' },
];

export function ReportsPage() {
  const [selectedType, setSelectedType] = useState<ReportType>('chats');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any>(null);

  const handlePreview = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getReportPreview(selectedType, startDate, endDate);
      setPreview(response.data);
    } catch (error) {
      console.error('Failed to preview report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const response = await adminApi.exportReport(selectedType, startDate, endDate);
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedType}_report_${startDate}_to_${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export report:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as ReportType)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              {reportTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {reportTypes.find((t) => t.value === selectedType)?.description}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={handlePreview}
              disabled={loading}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Preview
            </button>
            <button
              onClick={handleExport}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {preview && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Preview ({preview.totalRows} total rows)</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {preview.headers.map((header: string, index: number) => (
                    <th
                      key={index}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {preview.rows.map((row: any[], rowIndex: number) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {cell}
                      </td>
                    ))}
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
