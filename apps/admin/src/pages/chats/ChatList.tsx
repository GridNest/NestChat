import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DataTable } from '../../components/ui/DataTable';
import { ConfirmModal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { addToast } = useToast();
  const navigate = useNavigate();
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

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === chats.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(chats.map(c => c.id)));
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await adminApi.deleteChat(deleteId);
      addToast('success', 'Chat session deleted successfully');
      fetchChats();
    } catch {
      addToast('error', 'Failed to delete chat session');
    }
    setDeleteId(null);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} selected chat log(s)?`)) return;
    try {
      await adminApi.bulkDeleteChats(Array.from(selectedIds));
      addToast('success', `${selectedIds.size} chat log(s) deleted successfully`);
      setSelectedIds(new Set());
      fetchChats();
    } catch {
      addToast('error', 'Failed to delete selected chat logs');
    }
  };

  const columns = [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          checked={chats.length > 0 && selectedIds.size === chats.length}
          onChange={toggleSelectAll}
          className="rounded border-gray-300 cursor-pointer"
        />
      ),
      render: (item: Chat) => (
        <input
          type="checkbox"
          checked={selectedIds.has(item.id)}
          onChange={() => toggleSelect(item.id)}
          className="rounded border-gray-300 cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      key: 'id',
      label: 'Chat ID',
      render: (item: Chat) => (
        <Link to={`/chats/${item.id}`} className="text-blue-600 hover:text-blue-800 font-mono text-xs sm:text-sm font-medium">
          {item.id.slice(-8)}
        </Link>
      ),
    },
    { key: 'visitorId', label: 'Visitor' },
    {
      key: 'status',
      label: 'Status',
      render: (item: Chat) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
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
    {
      key: 'actions',
      label: 'Actions',
      render: (item: Chat) => (
        <div className="flex gap-3 items-center">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/chats/${item.id}`); }}
            className="text-blue-600 hover:text-blue-800 font-medium text-xs sm:text-sm"
          >
            View
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteId(item.id); }}
            className="text-red-600 hover:text-red-800 font-medium text-xs sm:text-sm"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chat Logs</h1>
          <p className="text-xs sm:text-sm text-gray-500">Manage and delete visitor chat sessions</p>
        </div>
        {selectedIds.size > 0 && (
          <button
            onClick={handleBulkDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition shadow-xs flex items-center gap-2"
          >
            Delete Selected ({selectedIds.size})
          </button>
        )}
      </div>

      <div className="flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white"
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

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Chat Log"
        message="Are you sure you want to delete this chat session and its complete message history? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
