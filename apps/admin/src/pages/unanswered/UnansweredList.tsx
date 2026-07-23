import React, { useState, useEffect } from 'react';
import { DataTable } from '../../components/ui/DataTable';
import { ConfirmModal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { adminApi } from '../../services/api';

interface UnansweredQuestion {
  id: string;
  question: string;
  count: number;
  lastAskedAt: string;
  createdAt: string;
}

export function UnansweredList() {
  const [questions, setQuestions] = useState<UnansweredQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [convertId, setConvertId] = useState<string | null>(null);
  const [convertType, setConvertType] = useState<'faq' | 'knowledge'>('faq');
  const { addToast } = useToast();
  const limit = 10;

  useEffect(() => {
    fetchQuestions();
  }, [page]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getUnanswered({
        page: page.toString(),
        limit: limit.toString(),
      });
      setQuestions(response.data?.questions || []);
      setTotal(response.data?.total || 0);
    } catch (error) {
      console.error('Failed to fetch unanswered questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await adminApi.deleteUnanswered(deleteId);
      addToast('success', 'Question deleted');
      fetchQuestions();
    } catch (error) {
      addToast('error', 'Failed to delete question');
    }
    setDeleteId(null);
  };

  const handleConvert = async () => {
    if (!convertId) return;
    try {
      await adminApi.convertUnanswered(convertId, convertType);
      addToast('success', `Converted to ${convertType}`);
      fetchQuestions();
    } catch (error) {
      addToast('error', `Failed to convert to ${convertType}`);
    }
    setConvertId(null);
  };

  const columns = [
    { key: 'question', label: 'Question' },
    {
      key: 'count',
      label: 'Times Asked',
      render: (item: UnansweredQuestion) => (
        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
          {item.count}
        </span>
      ),
    },
    {
      key: 'lastAskedAt',
      label: 'Last Asked',
      render: (item: UnansweredQuestion) => new Date(item.lastAskedAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: UnansweredQuestion) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setConvertId(item.id);
              setConvertType('faq');
            }}
            className="text-green-600 hover:text-green-800"
          >
            Convert to FAQ
          </button>
          <button
            onClick={() => {
              setConvertId(item.id);
              setConvertType('knowledge');
            }}
            className="text-blue-600 hover:text-blue-800"
          >
            Convert to Knowledge
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
        <h1 className="text-2xl font-bold">Unanswered Questions</h1>
      </div>

      <DataTable
        columns={columns}
        data={questions}
        loading={loading}
        emptyMessage="No unanswered questions"
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
        title="Delete Question"
        message="Are you sure you want to delete this unanswered question?"
        confirmText="Delete"
        variant="danger"
      />

      <ConfirmModal
        isOpen={!!convertId}
        onClose={() => setConvertId(null)}
        onConfirm={handleConvert}
        title={`Convert to ${convertType === 'faq' ? 'FAQ' : 'Knowledge'}`}
        message={`This question will be converted to a ${convertType === 'faq' ? 'FAQ' : 'Knowledge'} article. Continue?`}
        confirmText="Convert"
        variant="info"
      />
    </div>
  );
}
