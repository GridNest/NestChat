import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DataTable } from '../../components/ui/DataTable';
import { ConfirmModal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { adminApi } from '../../services/api';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  priority: number;
  language: string;
  isActive: boolean;
  createdAt: string;
}

export function FAQList() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { addToast } = useToast();
  const navigate = useNavigate();
  const limit = 10;

  useEffect(() => {
    fetchFAQs();
  }, [page, search, categoryFilter]);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getFAQs({
        page: page.toString(),
        limit: limit.toString(),
        search,
        category: categoryFilter,
      });
      setFaqs(response.data?.faqs || []);
      setTotal(response.data?.total || 0);
    } catch (error) {
      console.error('Failed to fetch FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await adminApi.deleteFAQ(deleteId);
      addToast('success', 'FAQ deleted');
      fetchFAQs();
    } catch (error) {
      addToast('error', 'Failed to delete FAQ');
    }
    setDeleteId(null);
  };

  const columns = [
    { key: 'question', label: 'Question', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    {
      key: 'priority',
      label: 'Priority',
      render: (item: FAQ) => (
        <span className="px-2 py-1 text-xs rounded-full bg-gray-100">
          {item.priority}
        </span>
      ),
    },
    { key: 'language', label: 'Language' },
    {
      key: 'isActive',
      label: 'Status',
      render: (item: FAQ) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {item.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: FAQ) => (
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/faqs/${item.id}/edit`)}
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
        <h1 className="text-2xl font-bold">FAQs</h1>
        <Link
          to="/faqs/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Add FAQ
        </Link>
      </div>

      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search FAQs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg"
        />
        <input
          type="text"
          placeholder="Category"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        />
      </div>

      <DataTable
        columns={columns}
        data={faqs}
        loading={loading}
        emptyMessage="No FAQs found"
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
        title="Delete FAQ"
        message="Are you sure you want to delete this FAQ?"
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
