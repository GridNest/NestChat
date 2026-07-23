import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DataTable } from '../../components/ui/DataTable';
import { adminApi } from '../../services/api';

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  status: string;
  source: string;
  language: string;
  createdAt: string;
}

export function InquiryList() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    fetchInquiries();
  }, [page, statusFilter]);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getInquiries({
        page: page.toString(),
        limit: limit.toString(),
        status: statusFilter,
        search,
      });
      setInquiries(response.data?.inquiries || []);
      setTotal(response.data?.total || 0);
    } catch (error) {
      console.error('Failed to fetch inquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (item: Inquiry) => (
        <Link to={`/inquiries/${item.id}`} className="text-blue-600 hover:text-blue-800">
          {item.name}
        </Link>
      ),
    },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'service', label: 'Service' },
    {
      key: 'status',
      label: 'Status',
      render: (item: Inquiry) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          item.status === 'new' ? 'bg-blue-100 text-blue-800' :
          item.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
          item.status === 'converted' ? 'bg-green-100 text-green-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {item.status}
        </span>
      ),
    },
    { key: 'language', label: 'Language' },
    {
      key: 'createdAt',
      label: 'Date',
      render: (item: Inquiry) => new Date(item.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Inquiries</h1>
      </div>

      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search inquiries..."
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
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="converted">Converted</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={inquiries}
        loading={loading}
        emptyMessage="No inquiries found"
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
