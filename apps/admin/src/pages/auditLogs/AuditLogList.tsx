import React, { useState, useEffect } from 'react';
import { DataTable } from '../../components/ui/DataTable';
import { adminApi } from '../../services/api';

interface AuditLog {
  id: string;
  userId: { name: string; email: string };
  clientId?: { name: string; companyName: string };
  action: string;
  module: string;
  resourceId?: string;
  createdAt: string;
}

export function AuditLogList() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    fetchLogs();
  }, [page, moduleFilter, actionFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAuditLogs({
        page: page.toString(),
        limit: limit.toString(),
        module: moduleFilter,
        action: actionFilter,
      });
      setLogs(response.data?.logs || []);
      setTotal(response.data?.total || 0);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'userId',
      label: 'User',
      render: (item: AuditLog) => item.userId?.name || 'System',
    },
    {
      key: 'module',
      label: 'Module',
      render: (item: AuditLog) => (
        <span className="px-2 py-1 text-xs rounded-full bg-gray-100">
          {item.module}
        </span>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      render: (item: AuditLog) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          item.action === 'create' ? 'bg-green-100 text-green-800' :
          item.action === 'delete' ? 'bg-red-100 text-red-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {item.action}
        </span>
      ),
    },
    {
      key: 'clientId',
      label: 'Client',
      render: (item: AuditLog) => item.clientId?.companyName || '-',
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (item: AuditLog) => new Date(item.createdAt).toLocaleString(),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Audit Logs</h1>
      </div>

      <div className="flex gap-4">
        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">All Modules</option>
          <option value="client">Client</option>
          <option value="knowledge">Knowledge</option>
          <option value="faq">FAQ</option>
          <option value="chat">Chat</option>
          <option value="inquiry">Inquiry</option>
          <option value="user">User</option>
          <option value="settings">Settings</option>
        </select>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">All Actions</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
          <option value="login">Login</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        loading={loading}
        emptyMessage="No audit logs found"
      />

      {total > limit && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-700">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page * limit >= total}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
