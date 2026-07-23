import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';
import { adminApi } from '../../services/api';

export function FAQForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [formData, setFormData] = useState({
    clientId: '',
    question: '',
    answer: '',
    category: '',
    priority: 0,
    language: 'en',
    keywords: '',
  });

  useEffect(() => {
    fetchClients();
    if (id) {
      fetchFAQ();
    }
  }, [id]);

  const fetchClients = async () => {
    try {
      const response = await adminApi.getClients({ page: '1', limit: '100' });
      setClients(response.data.clients.map((c: any) => ({ id: c.id, name: c.name })));
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    }
  };

  const fetchFAQ = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getFAQById(id!);
      setFormData({
        clientId: response.data.clientId || '',
        question: response.data.question || '',
        answer: response.data.answer || '',
        category: response.data.category || '',
        priority: response.data.priority || 0,
        language: response.data.language || 'en',
        keywords: response.data.keywords?.join(', ') || '',
      });
    } catch (error) {
      addToast('error', 'Failed to fetch FAQ');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = {
        ...formData,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
      };

      if (id) {
        await adminApi.updateFAQ(id, data);
        addToast('success', 'FAQ updated successfully');
      } else {
        await adminApi.createFAQ(data);
        addToast('success', 'FAQ created successfully');
      }
      navigate('/faqs');
    } catch (error) {
      addToast('error', 'Failed to save FAQ');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        {id ? 'Edit FAQ' : 'New FAQ'}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
          <select
            value={formData.clientId}
            onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
            required
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="">Select a client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Question *</label>
          <input
            type="text"
            value={formData.question}
            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
            required
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Answer *</label>
          <textarea
            value={formData.answer}
            onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
            required
            rows={6}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <input
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
            <select
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="both">Both</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keywords (comma separated)</label>
            <input
              type="text"
              value={formData.keywords}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
              placeholder="keyword1, keyword2"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate('/faqs')}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save FAQ'}
          </button>
        </div>
      </form>
    </div>
  );
}
