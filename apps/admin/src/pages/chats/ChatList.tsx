import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DataTable } from '../../components/ui/DataTable';
import { adminApi } from '../../services/api';

interface Chat {
  id: string;
  visitorId: string;
  status: string;
  language: string;
  messageCount: number;
  createdAt: string;
}

export function ChatList() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    fetchChats();
  }, [page, statusFilter]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getChats({
        page: page.toString(),
        limit: limit.toString(),
        status: statusFilter,
      });
      setChats(response.data?.chats || []);
      setTotal(response.data?.total || 0);
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'id',
      label: 'Chat ID',
      render: (item: Chat) => (
        <Link to={`/chats/${item.id}`} className="text-blue-600 hover:text-blue-800">
          {item.id.slice(-8)}
        </Link>
      ),
    },
    { key: 'visitorId', label: 'Visitor' },
    {
      key: 'status',
      label: 'Status',
      render: (item: Chat) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          item.status === 'active' ? 'bg-green-100 text-green-800' :
          item.status === 'closed' ? 'bg-gray-100 text-gray-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {item.status}
        </span>
      ),
    },
    { key: 'language', label: 'Language' },
    { key: 'messageCount', label: 'Messages' },
    {
      key: 'createdAt',
      label: 'Date',
      render: (item: Chat) => new Date(item.createdAt).toLocaleString(),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Chat Logs</h1>
      </div>

      <div className="flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={chats}
        loading={loading}
        emptyMessage="No chats found"
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
