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
  const [showPreview, setShowPreview] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    clientId: '',
    pageName: '',
    title: '',
    content: '',
    category: '',
    language: 'en' as 'en' | 'hi' | 'both',
    status: 'draft' as 'published' | 'draft',
    tags: '',
  });

  useEffect(() => {
    fetchClients();
    if (id) fetchKnowledge();
  }, [id]);

  const fetchClients = async () => {
    try {
      const response: any = await adminApi.getClients({ page: '1', limit: '100' });
      const clientList = response?.clients || response?.data?.clients || (Array.isArray(response) ? response : []);
      setClients(clientList.map((c: any) => ({ id: c.id || c._id, name: c.name || c.companyName })));
    } catch {
      console.error('Failed to fetch clients');
    }
  };

  const fetchKnowledge = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getKnowledgeById(id!);
      setFormData({
        clientId: data.clientId || '',
        pageName: data.pageName || '',
        title: data.title || '',
        content: data.content || '',
        category: data.category || '',
        language: data.language || 'en',
        status: data.status ? data.status : (data.isActive ? 'published' : 'draft'),
        tags: (data.tags || []).join(', '),
      });
      setLastUpdated(data.updatedAt ? new Date(data.updatedAt).toLocaleString() : null);
      if (data.clientId) fetchCategories(data.clientId);
    } catch {
      addToast('error', 'Failed to fetch article');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async (clientId: string) => {
    try {
      const response = await adminApi.getKnowledgeCategories(clientId);
      setAvailableCategories(response.data || []);
    } catch {
      console.error('Failed to fetch categories');
    }
  };

  const handleClientChange = (clientId: string) => {
    setFormData({ ...formData, clientId });
    if (clientId) fetchCategories(clientId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = {
        ...formData,
        tags: formData.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
      };

      if (id) {
        await adminApi.updateKnowledge(id, data);
        addToast('success', 'Article updated successfully');
      } else {
        await adminApi.createKnowledge(data);
        addToast('success', 'Article created successfully');
      }
      navigate('/knowledge');
    } catch {
      addToast('error', 'Failed to save article');
    } finally {
      setSaving(false);
    }
  };

  const renderMarkdown = (text: string) => {
    const html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/### (.+)/g, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
      .replace(/## (.+)/g, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>')
      .replace(/# (.+)/g, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
      .replace(/^- (.+)/gm, '<li class="ml-4 list-disc">$1</li>')
      .replace(/\n\n/g, '</p><p class="mb-2">')
      .replace(/\n/g, '<br/>');
    return `<p class="mb-2">${html}</p>`;
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
          {id ? 'Edit Article' : 'New Article'}
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Manage knowledge base articles and documentation content</p>
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
              onChange={(e) => handleClientChange(e.target.value)}
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
          <label className={labelClass}>Page Name *</label>
          <input
            type="text"
            value={formData.pageName}
            onChange={(e) => setFormData({ ...formData, pageName: e.target.value })}
            required
            placeholder="e.g., working-hours, pricing, about-us"
            maxLength={100}
            className={inputClass}
          />
          <span className="text-[11px] text-gray-400 mt-1 block">{formData.pageName.length}/100</span>
        </div>

        <div>
          <label className={labelClass}>Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            maxLength={200}
            className={inputClass}
          />
          <span className="text-[11px] text-gray-400 mt-1 block">{formData.title.length}/200</span>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className={labelClass}>Content * (Markdown supported)</label>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-800 p-1 min-h-[36px]"
            >
              {showPreview ? 'Edit' : 'Preview'}
            </button>
          </div>
          {showPreview ? (
            <div
              className="w-full min-h-[300px] p-4 border border-gray-300 rounded-xl bg-white prose prose-sm max-w-none break-words"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(formData.content) }}
            />
          ) : (
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              rows={10}
              maxLength={50000}
              className={`${inputClass} font-mono text-xs sm:text-sm leading-relaxed`}
              placeholder="Write your content here...&#10;&#10;Use markdown for formatting:&#10;# Heading 1&#10;## Heading 2&#10;**bold** *italic*&#10;- List item&#10;`code`"
            />
          )}
          {!showPreview && (
            <span className="text-[11px] text-gray-400 mt-1 block">{formData.content.length} characters</span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <div>
            <label className={labelClass}>Category</label>
            <div className="flex gap-2">
              <input
                type="text"
                list="category-suggestions"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className={inputClass}
                placeholder="Add or select category"
              />
              <datalist id="category-suggestions">
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
          </div>
          <div>
            <label className={labelClass}>Language</label>
            <select
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value as 'en' | 'hi' | 'both' })}
              className={inputClass}
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="both">Both</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Tags (comma separated)</label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="tag1, tag2, tag3"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate('/knowledge')}
            className="w-full sm:w-auto px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 text-xs sm:text-sm font-medium min-h-[44px] flex items-center justify-center transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 text-xs sm:text-sm font-medium min-h-[44px] flex items-center justify-center transition-colors shadow-sm"
          >
            {saving ? 'Saving...' : 'Save Article'}
          </button>
        </div>
      </form>
    </div>
  );
}

