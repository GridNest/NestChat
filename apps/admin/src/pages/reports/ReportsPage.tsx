import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

type ReportType = 'chats' | 'leads' | 'visitors' | 'knowledge' | 'faq' | 'inquiries';

interface Client {
  _id: string;
  name: string;
}

const reportTypes: Array<{ value: ReportType; label: string; description: string }> = [
  { value: 'chats', label: 'Chat Reports', description: 'Conversation details and metrics' },
  { value: 'leads', label: 'Lead Reports', description: 'Captured leads and contact info' },
  { value: 'visitors', label: 'Visitor Reports', description: 'Daily visitor statistics' },
  { value: 'knowledge', label: 'Knowledge Reports', description: 'Knowledge base articles' },
  { value: 'faq', label: 'FAQ Reports', description: 'FAQ items and usage' },
  { value: 'inquiries', label: 'Inquiry Reports', description: 'All inquiries and status' },
];

export function ReportsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [selectedType, setSelectedType] = useState<ReportType>('chats');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  useEffect(() => {
    if (isAdmin) {
      adminApi.getClients().then((res: any) => {
        const list = res.data?.clients || res.clients || res.data?.data || (Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []));
        setClients(Array.isArray(list) ? list : []);
      }).catch(() => {
        setClients([]);
      });
    }
  }, []);

  const handlePreview = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getReportPreview(selectedType, startDate, endDate, selectedClientId);
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
      const response = await adminApi.exportReport(selectedType, startDate, endDate, selectedClientId);
      
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
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Reports</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Generate and export analytics, chat, and lead reports</p>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {isAdmin && (
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                Client
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm bg-white min-h-[44px]"
              >
                <option value="">All Clients</option>
                {clients.map((client) => (
                  <option key={client._id} value={client._id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
              Report Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as ReportType)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm bg-white min-h-[44px]"
            >
              {reportTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-gray-400 mt-1">
              {reportTypes.find((t) => t.value === selectedType)?.description}
            </p>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm min-h-[44px]"
            />
          </div>

          <div className="flex items-end gap-2 pt-2 sm:pt-0">
            <button
              onClick={handlePreview}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-50 text-xs sm:text-sm font-medium min-h-[44px] transition-colors"
            >
              Preview
            </button>
            <button
              onClick={handleExport}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 text-xs sm:text-sm font-medium min-h-[44px] transition-colors shadow-sm"
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
                  {(Array.isArray(preview.headers) ? preview.headers : []).map((header: string, index: number) => (
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
                {(Array.isArray(preview.rows) ? preview.rows : []).map((row: any[], rowIndex: number) => (
                  <tr key={rowIndex}>
                    {(Array.isArray(row) ? row : []).map((cell, cellIndex) => (
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
