import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';
import { Modal } from '../../components/ui/Modal';
import { adminApi } from '../../services/api';

export function FAQForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    clientId: '',
    question: '',
    answer: '',
    category: '',
    priority: 0,
    language: 'en',
    keywords: '',
    status: 'published' as 'published' | 'draft',
  });

  useEffect(() => {
    fetchClients();
    if (id) fetchFAQ();
  }, [id]);

  const fetchClients = async () => {
    try {
      const response = await adminApi.getClients({ page: '1', limit: '100' });
      const clientList = response.clients || response.data?.clients || (Array.isArray(response) ? response : []);
      setClients(clientList.map((c: any) => ({ id: c.id || c._id, name: c.name || c.companyName })));
    } catch {
      console.error('Failed to fetch clients');
    }
  };

  const fetchFAQ = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getFAQById(id!);
      const data = response;
      setFormData({
        clientId: data.clientId || '',
        question: data.question || '',
        answer: data.answer || '',
        category: data.category || '',
        priority: data.priority || 0,
        language: data.language || 'en',
        keywords: (data.keywords || []).join(', '),
        status: data.status || (data.isActive ? 'published' : 'draft'),
      });
      setLastUpdated(data.updatedAt ? new Date(data.updatedAt).toLocaleString() : null);
    } catch {
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
    } catch {
      addToast('error', 'Failed to save FAQ');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  const inputClass = 'w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm bg-white min-h-[44px]';
  const labelClass = 'block text-xs sm:text-sm font-medium text-gray-700 mb-1.5';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
          {id ? 'Edit FAQ' : 'New FAQ'}
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Manage automated bot responses for common questions</p>
      </div>

      {lastUpdated && (
        <div className="p-3 bg-gray-50 rounded-xl text-xs sm:text-sm text-gray-600 border border-gray-100">
          Last updated: {lastUpdated}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <div>
            <label className={labelClass}>Client *</label>
            <select
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              required
              className={inputClass}
            >
              <option value="">Select a client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'published' | 'draft' })}
              className={inputClass}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Question *</label>
          <input
            type="text"
            value={formData.question}
            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
            required
            maxLength={500}
            className={inputClass}
          />
          <span className="text-[11px] text-gray-400 mt-1 block">{formData.question.length}/500</span>
        </div>

        <div>
          <label className={labelClass}>Answer *</label>
          <textarea
            value={formData.answer}
            onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
            required
            rows={5}
            className={`${inputClass} leading-relaxed`}
          />
          <span className="text-[11px] text-gray-400 mt-1 block">{formData.answer.length} characters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          <div>
            <label className={labelClass}>Category</label>
            <input
              type="text"
              list="faq-category-suggestions"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className={inputClass}
            />
            <datalist id="faq-category-suggestions">
              {availableCategories.map(cat => <option key={cat} value={cat} />)}
            </datalist>
          </div>
          <div>
            <label className={labelClass}>Priority</label>
            <input
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
              min={0}
              max={100}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Language</label>
            <select
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              className={inputClass}
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="both">Both</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Keywords / Tags (comma separated)</label>
          <input
            type="text"
            value={formData.keywords}
            onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
            placeholder="faq, pricing, support"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate('/faqs')}
            className="w-full sm:w-auto px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 text-xs sm:text-sm font-medium min-h-[44px] flex items-center justify-center transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 text-xs sm:text-sm font-medium min-h-[44px] flex items-center justify-center transition-colors shadow-sm"
          >
            {saving ? 'Saving...' : 'Save FAQ'}
          </button>
        </div>
      </form>
    </div>
  );
}
