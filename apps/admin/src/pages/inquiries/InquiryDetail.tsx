import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';
import { adminApi } from '../../services/api';

interface InquiryDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  country?: string;
  state?: string;
  service: string;
  details: string;
  company?: string;
  status: string;
  source: string;
  language: string;
  externalApiStatus: string;
  createdAt: string;
}

export function InquiryDetail() {
  const { id } = useParams<{ id: string }>();
  const { addToast } = useToast();
  const [inquiry, setInquiry] = useState<InquiryDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchInquiry();
    }
  }, [id]);

  const fetchInquiry = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getInquiryById(id!);
      setInquiry(response.data);
    } catch (error) {
      console.error('Failed to fetch inquiry:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status: string) => {
    try {
      await adminApi.updateInquiryStatus(id!, status);
      addToast('success', 'Status updated');
      setInquiry(prev => prev ? { ...prev, status } : null);
    } catch (error) {
      addToast('error', 'Failed to update status');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!inquiry) {
    return <div className="text-center py-8">Inquiry not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Inquiry Details</h1>
          <p className="text-gray-500">From {inquiry.name}</p>
        </div>
        <Link to="/inquiries" className="text-blue-600 hover:text-blue-800">
          Back to Inquiries
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-gray-500">Name:</dt>
              <dd className="font-medium">{inquiry.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Email:</dt>
              <dd className="font-medium">{inquiry.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Phone:</dt>
              <dd className="font-medium">{inquiry.phone}</dd>
            </div>
            {inquiry.company && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Company:</dt>
                <dd className="font-medium">{inquiry.company}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Inquiry Details</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-gray-500">Service:</dt>
              <dd className="font-medium">{inquiry.service}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Status:</dt>
              <dd>
                <select
                  value={inquiry.status}
                  onChange={(e) => handleStatusUpdate(e.target.value)}
                  className="px-2 py-1 text-sm border rounded"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="converted">Converted</option>
                  <option value="closed">Closed</option>
                </select>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Source:</dt>
              <dd className="font-medium">{inquiry.source}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Language:</dt>
              <dd className="font-medium">{inquiry.language}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">API Status:</dt>
              <dd>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  inquiry.externalApiStatus === 'forwarded' ? 'bg-green-100 text-green-800' :
                  inquiry.externalApiStatus === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {inquiry.externalApiStatus}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Details</h2>
        <p className="text-gray-700 whitespace-pre-wrap">{inquiry.details}</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Timeline</h2>
        <dl className="space-y-3">
          <div className="flex justify-between">
            <dt className="text-gray-500">Created:</dt>
            <dd className="font-medium">{new Date(inquiry.createdAt).toLocaleString()}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
