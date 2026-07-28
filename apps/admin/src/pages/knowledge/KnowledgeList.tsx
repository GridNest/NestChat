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
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
  clientId?: string | { _id: string; companyName: string; name: string; clientId: string };
}

export function KnowledgeList() {
  const [knowledge, setKnowledge] = useState<Knowledge[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showImport, setShowImport] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [importPreview, setImportPreview] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const { addToast } = useToast();
  const navigate = useNavigate();
  const limit = 10;

  useEffect(() => {
    fetchKnowledge();
    fetchCategories();
  }, [page, search, categoryFilter, statusFilter]);

  const fetchKnowledge = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {
        page: page.toString(),
        limit: limit.toString(),
      };
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status = statusFilter;

      const response = await adminApi.getKnowledge(params);
      setKnowledge(response.data?.knowledge || []);
      setTotal(response.data?.total || 0);
    } catch (error) {
      console.error('Failed to fetch knowledge:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await adminApi.getKnowledgeCategories('');
      setAvailableCategories(response.data || []);
    } catch {
      console.error('Failed to fetch categories');
    }
  };

  const handleExport = async () => {
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      const response = await adminApi.exportKnowledge(params);
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `knowledge-export-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('success', 'Knowledge exported');
    } catch {
      addToast('error', 'Failed to export knowledge');
    }
  };

  const handleDownloadTemplate = () => {
    adminApi.downloadKnowledgeTemplate();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      previewImport(text);
    };
    reader.readAsText(file);
  };

  const previewImport = async (csv: string) => {
    try {
      const response = await adminApi.previewKnowledgeImport(csv);
      setImportPreview(response.data || response);
      setImportResult(null);
    } catch {
      addToast('error', 'Failed to preview import');
    }
  };

  const handleImport = async () => {
    if (!csvContent) return;
    setImporting(true);
    try {
      const response = await adminApi.importKnowledge(csvContent);
      setImportResult(response.data || response);
      addToast('success', `Imported ${(response.data || response).imported} articles`);
      fetchKnowledge();
    } catch {
      addToast('error', 'Failed to import knowledge');
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await adminApi.deleteKnowledge(deleteId);
      addToast('success', 'Knowledge article deleted');
      fetchKnowledge();
    } catch {
      addToast('error', 'Failed to delete article');
    }
    setDeleteId(null);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} articles?`)) return;
    try {
      await adminApi.bulkDeleteKnowledge(Array.from(selectedIds));
      addToast('success', `${selectedIds.size} articles deleted`);
      setSelectedIds(new Set());
      fetchKnowledge();
    } catch {
      addToast('error', 'Failed to delete articles');
    }
  };

  const handleBulkStatus = async (status: 'published' | 'draft') => {
    if (selectedIds.size === 0) return;
    try {
      await adminApi.bulkUpdateKnowledgeStatus(Array.from(selectedIds), status);
      addToast('success', `${selectedIds.size} articles updated to ${status}`);
      setSelectedIds(new Set());
      fetchKnowledge();
    } catch {
      addToast('error', 'Failed to update articles');
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
    if (selectedIds.size === knowledge.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(knowledge.map(k => k.id)));
    }
  };

  const handleToggleEnable = async (id: string, isActive: boolean) => {
    try {
      await adminApi.updateKnowledge(id, { isActive });
      setKnowledge(prev => prev.map(k => k.id === id ? { ...k, isActive } : k));
      addToast('success', `Article ${isActive ? 'enabled' : 'disabled'}`);
    } catch {
      addToast('error', 'Failed to toggle article status');
    }
  };

  const columns = [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          checked={knowledge.length > 0 && selectedIds.size === knowledge.length}
          onChange={toggleSelectAll}
          className="rounded border-gray-300"
        />
      ),
      render: (item: Knowledge) => (
        <input
          type="checkbox"
          checked={selectedIds.has(item.id)}
          onChange={() => toggleSelect(item.id)}
          className="rounded border-gray-300"
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    { key: 'title', label: 'Title', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    {
      key: 'isActive',
      label: 'Enable/Disable',
      render: (item: Knowledge) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={item.isActive ?? true}
              onChange={(e) => handleToggleEnable(item.id, e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
          </label>
          <span className="text-xs text-gray-500 font-medium">
            {item.isActive ? 'Active' : 'Disabled'}
          </span>
        </div>
      ),
    },
    {
      key: 'client',
      label: 'Client Name & ID',
      render: (item: Knowledge) => {
        const clientObj = typeof item.clientId === 'object' ? (item.clientId as any) : null;
        const name = clientObj?.companyName || clientObj?.name || (typeof item.clientId === 'string' ? item.clientId : 'System');
        const idBadge = clientObj?.clientId || (typeof item.clientId === 'string' ? item.clientId : '');
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900 text-xs sm:text-sm">{name}</span>
            {idBadge && (
              <span className="inline-block px-1.5 py-0.5 mt-0.5 text-[10px] font-mono font-medium bg-blue-50 text-blue-700 rounded border border-blue-100 max-w-fit">
                ID: {idBadge}
              </span>
            )}
          </div>
        );
      },
    },
    { key: 'language', label: 'Language' },
    {
      key: 'updatedAt',
      label: 'Last Updated',
      render: (item: Knowledge) => (
        <span className="text-sm text-gray-500">
          {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}
        </span>
      ),
    },
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
            onClick={(e) => { e.stopPropagation(); navigate(`/knowledge/${item.id}/edit`); }}
            className="text-blue-600 hover:text-blue-800"
          >
            Edit
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteId(item.id); }}
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Knowledge Base</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Manage articles and documentation for chat responses</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={handleDownloadTemplate} className="px-3 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 text-xs sm:text-sm font-medium min-h-[40px] transition-colors">Download Template</button>
          <button onClick={() => setShowImport(true)} className="px-3 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 text-xs sm:text-sm font-medium min-h-[40px] transition-colors">Import CSV</button>
          <button onClick={handleExport} className="px-3 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 text-xs sm:text-sm font-medium min-h-[40px] transition-colors">Export CSV</button>
          <Link to="/knowledge/new" className="bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 text-xs sm:text-sm font-medium min-h-[44px] flex items-center justify-center gap-1.5 shadow-sm transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Article</span>
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search articles..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm min-h-[44px]"
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm bg-white min-h-[44px]"
        >
          <option value="">All Categories</option>
          {availableCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm bg-white min-h-[44px]"
        >
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>


      {selectedIds.size > 0 && (
        <div className="flex gap-2 items-center p-3 bg-blue-50 rounded-lg">
          <span className="text-sm font-medium text-blue-700">{selectedIds.size} selected</span>
          <button
            onClick={() => handleBulkStatus('published')}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
          >
            Publish
          </button>
          <button
            onClick={() => handleBulkStatus('draft')}
            className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Draft
          </button>
          <button
            onClick={handleBulkDelete}
            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      )}

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

      {showImport && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => { setShowImport(false); setImportPreview(null); setImportResult(null); }}></div>
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Import Knowledge from CSV</h3>
                <button onClick={() => { setShowImport(false); setImportPreview(null); setImportResult(null); }} className="text-gray-400 hover:text-gray-500">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {!importResult ? (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload CSV File</label>
                    <input type="file" accept=".csv" onChange={handleFileUpload} className="w-full" />
                    <p className="text-xs text-gray-500 mt-1">
                      Required columns: clientId, pageName, title, content. Optional: category, tags, status, language, priority
                    </p>
                  </div>

                  {importPreview && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Preview</h4>
                      <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
                        <p>Total rows: <strong>{importPreview.total}</strong></p>
                        <p className="text-green-600">Valid: <strong>{importPreview.valid}</strong></p>
                        {importPreview.duplicates > 0 && <p className="text-yellow-600">Duplicates: <strong>{importPreview.duplicates}</strong></p>}
                        {importPreview.errors > 0 && <p className="text-red-600">Errors: <strong>{importPreview.errors}</strong></p>}
                      </div>
                      {importPreview.rows?.length > 0 && (
                        <div className="mt-2 max-h-40 overflow-y-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="p-1 text-left">Row</th>
                                <th className="p-1 text-left">Title</th>
                                <th className="p-1 text-left">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {importPreview.rows.slice(0, 20).map((row: any, i: number) => (
                                <tr key={i} className="border-t">
                                  <td className="p-1">{row.row}</td>
                                  <td className="p-1 truncate max-w-[200px]">{row.title}</td>
                                  <td className="p-1">
                                    <span className={`px-1 py-0.5 rounded ${row.status === 'valid' ? 'bg-green-100 text-green-700' : row.status === 'skipped' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{row.status}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setShowImport(false); setImportPreview(null); setImportResult(null); }} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                    <button onClick={handleImport} disabled={!csvContent || importing} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                      {importing ? 'Importing...' : 'Import'}
                    </button>
                  </div>
                </>
              ) : (
                <div>
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <h4 className="font-medium mb-2">Import Result</h4>
                    <p className="text-green-600">Imported: <strong>{importResult.imported || 0}</strong></p>
                    <p className="text-yellow-600">Skipped: <strong>{importResult.skipped || 0}</strong></p>
                    <p className="text-red-600">Errors: <strong>{importResult.errors || 0}</strong></p>
                  </div>
                  {importResult.rows?.length > 0 && (
                    <div className="max-h-60 overflow-y-auto mb-4">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="p-2 text-left">Row</th>
                            <th className="p-2 text-left">Title</th>
                            <th className="p-2 text-left">Status</th>
                            <th className="p-2 text-left">Message</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importResult.rows.map((row: any, i: number) => (
                            <tr key={i} className="border-t">
                              <td className="p-2">{row.row}</td>
                              <td className="p-2 truncate max-w-[200px]">{row.title}</td>
                              <td className="p-2">
                                <span className={`px-1 py-0.5 rounded ${row.status === 'imported' ? 'bg-green-100 text-green-700' : row.status === 'skipped' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{row.status}</span>
                              </td>
                              <td className="p-2 text-gray-500">{row.message}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="flex justify-end">
                    <button onClick={() => { setShowImport(false); setImportPreview(null); setImportResult(null); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Close</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
