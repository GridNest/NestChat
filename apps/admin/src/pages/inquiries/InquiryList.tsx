import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/api';

interface Inquiry {
  id: string;
  clientId: string | { _id: string; companyName: string; name: string };
  name: string;
  email: string;
  phone: string;
  service: string;
  details?: string;
  status: 'new' | 'contacted' | 'converted' | 'archived' | 'closed';
  source: 'chatbot' | 'website' | 'manual';
  language: string;
  createdAt: string;
}

interface ClientOption {
  id: string;
  name: string;
  companyName: string;
}

export function InquiryList() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    fetchInquiries();
  }, [page, statusFilter, dateFilter, clientFilter, search]);

  const fetchClients = async () => {
    try {
      const res = await adminApi.getClients({ limit: '100' });
      const clientList = res.clients || res.data?.clients || (Array.isArray(res) ? res : []);
      setClients(clientList);
    } catch (error) {
      console.error('Failed to fetch client options:', error);
    }
  };

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {
        page: page.toString(),
        limit: limit.toString(),
      };
      if (statusFilter) params.status = statusFilter;
      if (dateFilter) params.dateFilter = dateFilter;
      if (clientFilter) params.clientId = clientFilter;
      if (search) params.search = search;

      const response = await adminApi.getInquiries(params);
      setInquiries(response.data?.inquiries || []);
      setTotal(response.data?.total || 0);
    } catch (error) {
      console.error('Failed to fetch inquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await adminApi.updateInquiryStatus(id, newStatus);
      setInquiries(prev =>
        prev.map(item => (item.id === id ? { ...item, status: newStatus as any } : item))
      );
    } catch (error) {
      console.error('Failed to update inquiry status:', error);
      alert('Failed to update status');
    }
  };

  const handleExportCSV = () => {
    if (inquiries.length === 0) {
      alert('No inquiry data to export');
      return;
    }

    const headers = ['Name', 'Phone', 'Email', 'Details/Service', 'Source', 'Status', 'Date'];
    const rows = inquiries.map(item => [
      `"${(item.name || '').replace(/"/g, '""')}"`,
      `"${(item.phone || '').replace(/"/g, '""')}"`,
      `"${(item.email || '').replace(/"/g, '""')}"`,
      `"${(item.details || item.service || '').replace(/"/g, '""')}"`,
      `"${item.source || 'chatbot'}"`,
      `"${item.status || 'new'}"`,
      `"${new Date(item.createdAt).toLocaleString()}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inquiries_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate summary counts
  const newCount = inquiries.filter(i => i.status === 'new').length;
  const contactedCount = inquiries.filter(i => i.status === 'contacted').length;
  const convertedCount = inquiries.filter(i => i.status === 'converted').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Inquiries & Leads</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Manage customer lead submissions and inquiry status lifecycle</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl hover:bg-emerald-700 font-medium text-xs sm:text-sm transition-colors min-h-[44px] flex items-center justify-center gap-2 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-xs text-gray-500 font-medium">Total Inquiries</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">{total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-blue-100 bg-blue-50/20 shadow-sm">
          <span className="text-xs text-blue-600 font-medium">New Leads</span>
          <p className="text-2xl font-bold text-blue-700 mt-1">{newCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-100 bg-amber-50/20 shadow-sm">
          <span className="text-xs text-amber-600 font-medium">Contacted</span>
          <p className="text-2xl font-bold text-amber-700 mt-1">{contactedCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-100 bg-emerald-50/20 shadow-sm">
          <span className="text-xs text-emerald-600 font-medium">Converted</span>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{convertedCount}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Search</label>
          <input
            type="text"
            placeholder="Search name, phone, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Status Filter</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px]"
          >
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="converted">Converted</option>
            <option value="archived">Archived</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Date Range</label>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px]"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Client Filter</label>
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px]"
          >
            <option value="">All Clients</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.companyName || c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 text-sm">Loading inquiries...</div>
      ) : inquiries.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500 text-sm">
          No inquiries found matching your filters.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full">
          <div className="overflow-x-auto w-full">
            <table className="min-w-full divide-y divide-gray-200 text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase">Name</th>
                  <th className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase">Phone</th>
                  <th className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase">Email</th>
                  <th className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase">Message / Details</th>
                  <th className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase">Source</th>
                  <th className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase">Submitted Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inquiries.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/20 transition-colors">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <Link to={`/inquiries/${item.id}`} className="text-sm font-semibold text-blue-600 hover:text-blue-800">
                        {item.name}
                      </Link>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-mono text-gray-900">
                      {item.phone || '-'}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                      {item.email}
                    </td>
                    <td className="px-4 sm:px-6 py-4 max-w-xs truncate text-xs sm:text-sm text-gray-700">
                      {item.details || item.service || '-'}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs">
                      <span className="px-2 py-0.5 rounded font-mono font-medium bg-gray-100 text-gray-700 capitalize">
                        {item.source || 'chatbot'}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border focus:outline-none cursor-pointer capitalize ${
                          item.status === 'new' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          item.status === 'contacted' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          item.status === 'converted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          'bg-gray-100 text-gray-700 border-gray-200'
                        }`}
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="converted">Converted</option>
                        <option value="archived">Archived</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {total > limit && (
        <div className="flex justify-between items-center pt-2">
          <span className="text-xs sm:text-sm text-gray-500">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} leads
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 min-h-[36px]"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page * limit >= total}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 min-h-[36px]"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
