import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/api';

interface Client {
  id: string;
  clientId: string;
  name: string;
  email: string;
  companyName: string;
  website?: string;
  websiteType: string;
  status: string;
  isActive: boolean;
  createdAt: string;
}

export function ClientList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    fetchClients();
  }, [page, search, statusFilter]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {
        page: page.toString(),
        limit: limit.toString(),
      };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const response = await adminApi.getClients(params);
      setClients(response.data.clients);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this client and all associated data?')) return;
    
    try {
      await adminApi.deleteClient(id);
      fetchClients();
    } catch (error) {
      console.error('Failed to delete client:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800 border border-green-200',
      inactive: 'bg-gray-100 text-gray-800 border border-gray-200',
      suspended: 'bg-red-100 text-red-800 border border-red-200',
    };
    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Clients</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Manage registered clients and bot instances</p>
        </div>
        <Link
          to="/clients/new"
          className="bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 font-medium text-sm transition-colors min-h-[44px] flex items-center justify-center gap-2 shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Client</span>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[44px]"
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white min-h-[44px]"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 text-sm">Loading clients...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full max-w-full">
          <div className="overflow-x-auto w-full">
            <table className="min-w-full divide-y divide-gray-200 text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase">Client Name & ID</th>
                  <th className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase">Company</th>
                  <th className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase">Email</th>
                  <th className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase">Website</th>
                  <th className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase">Created Date</th>
                  <th className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">{client.name}</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            ID: {client.clientId}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {client.companyName}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {client.email}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                      {client.website ? (
                        <a
                          href={client.website.startsWith('http') ? client.website : `https://${client.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                        >
                          <span className="truncate max-w-[160px]">{client.website}</span>
                          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(client.status)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                      {new Date(client.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-3 min-h-[36px]">
                        <Link to={`/clients/${client.id}`} className="text-blue-600 hover:text-blue-800 font-medium p-1">
                          View
                        </Link>
                        <Link to={`/clients/${client.id}/edit`} className="text-green-600 hover:text-green-800 font-medium p-1">
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(client.id)}
                          className="text-red-600 hover:text-red-800 font-medium p-1"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {clients.length === 0 && (
            <div className="text-center py-12 text-gray-500 text-sm">No clients found</div>
          )}

          <div className="bg-gray-50 px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-gray-200">
            <span className="text-xs sm:text-sm text-gray-600">
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} clients
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-xs sm:text-sm font-medium border border-gray-300 rounded-xl hover:bg-gray-100 disabled:opacity-50 min-h-[44px]"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * limit >= total}
                className="px-4 py-2 text-xs sm:text-sm font-medium border border-gray-300 rounded-xl hover:bg-gray-100 disabled:opacity-50 min-h-[44px]"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

