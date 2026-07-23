import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';
import { adminApi } from '../../services/api';

export function KnowledgeForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [formData, setFormData] = useState({
    clientId: '',
    pageName: '',
    title: '',
    content: '',
    category: '',
    language: 'en',
    status: 'draft',
    tags: '',
  });

  useEffect(() => {
    fetchClients();
    if (id) {
      fetchKnowledge();
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

  const fetchKnowledge = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getKnowledgeById(id!);
      setFormData({
        clientId: response.data.clientId || '',
        pageName: response.data.pageName || '',
        title: response.data.title || '',
        content: response.data.content || '',
        category: response.data.category || '',
        language: response.data.language || 'en',
        status: response.data.status || 'draft',
        tags: response.data.tags?.join(', ') || '',
      });
    } catch (error) {
      addToast('error', 'Failed to fetch article');
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
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      };

      if (id) {
        await adminApi.updateKnowledge(id, data);
        addToast('success', 'Article updated successfully');
      } else {
        await adminApi.createKnowledge(data);
        addToast('success', 'Article created successfully');
      }
      navigate('/knowledge');
    } catch (error) {
      addToast('error', 'Failed to save article');
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
        {id ? 'Edit Article' : 'New Article'}
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Page Name *</label>
          <input
            type="text"
            value={formData.pageName}
            onChange={(e) => setFormData({ ...formData, pageName: e.target.value })}
            required
            placeholder="e.g., working-hours, pricing, about-us"
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            required
            rows={10}
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
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="tag1, tag2, tag3"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate('/knowledge')}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Article'}
          </button>
        </div>
      </form>
    </div>
  );
}
