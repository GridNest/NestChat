import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DataTable } from '../../components/ui/DataTable';
import { ConfirmModal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { adminApi } from '../../services/api';

interface Knowledge {
  id: string;
  title: string;
  category: string;
  status: string;
  language: string;
  createdAt: string;
}

export function KnowledgeList() {
  const [knowledge, setKnowledge] = useState<Knowledge[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { addToast } = useToast();
  const navigate = useNavigate();
  const limit = 10;

  useEffect(() => {
    fetchKnowledge();
  }, [page, search, categoryFilter, statusFilter]);

  const fetchKnowledge = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getKnowledge({
        page: page.toString(),
        limit: limit.toString(),
        search,
        category: categoryFilter,
        status: statusFilter,
      });
      setKnowledge(response.data?.knowledge || []);
      setTotal(response.data?.total || 0);
    } catch (error) {
      console.error('Failed to fetch knowledge:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await adminApi.deleteKnowledge(deleteId);
      addToast('success', 'Knowledge article deleted');
      fetchKnowledge();
    } catch (error) {
      addToast('error', 'Failed to delete article');
    }
    setDeleteId(null);
  };

  const columns = [
    { key: 'title', label: 'Title', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    {
      key: 'status',
      label: 'Status',
      render: (item: Knowledge) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          item.status === 'published' ? 'bg-green-100 text-green-800' :
          item.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {item.status}
        </span>
      ),
    },
    { key: 'language', label: 'Language' },
    {
      key: 'createdAt',
      label: 'Created',
      render: (item: Knowledge) => new Date(item.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: Knowledge) => (
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/knowledge/${item.id}/edit`)}
            className="text-blue-600 hover:text-blue-800"
          >
            Edit
          </button>
          <button
            onClick={() => setDeleteId(item.id)}
            className="text-red-600 hover:text-red-800"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Knowledge Base</h1>
        <Link
          to="/knowledge/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Add Article
        </Link>
      </div>

      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search articles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={knowledge}
        loading={loading}
        emptyMessage="No knowledge articles found"
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
        title="Delete Article"
        message="Are you sure you want to delete this knowledge article? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
