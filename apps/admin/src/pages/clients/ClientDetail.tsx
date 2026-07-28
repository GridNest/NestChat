import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { adminApi } from '../../services/api';

interface SyncResult {
  success: boolean;
  pagesScraped?: number;
  itemsExtracted?: number;
  message?: string;
  error?: string;
}

interface Client {
  id: string;
  clientId: string;
  name: string;
  email: string;
  companyName: string;
  phone?: string;
  website?: string;
  websiteType: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  botName: string;
  defaultLanguage: string;
  timezone: string;
  status: string;
  isActive: boolean;
  createdAt: string;
}

interface ClientConfig {
  greetingMessage: string;
  widgetPosition: string;
  widgetStyle: string;
  theme: string;
  quickActions: string[];
  businessHours?: string;
  contactEmail?: string;
  contactPhone?: string;
  fallbackMessage: string;
  allowedLanguages: string[];
}

interface ClientModule {
  name: string;
  enabled: boolean;
}

export function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [config, setConfig] = useState<ClientConfig | null>(null);
  const [modules, setModules] = useState<ClientModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'config' | 'modules'>('overview');
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  const [syncStats, setSyncStats] = useState({
    status: 'idle',
    lastSync: null as string | null,
    pagesIndexed: 0,
    knowledgeCount: 0,
    faqCount: 0,
  });

  useEffect(() => {
    if (id) {
      fetchClientData();
    }
  }, [id]);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      const [clientRes, configRes, modulesRes, knowledgeRes, faqRes, websiteRes] = await Promise.allSettled([
        adminApi.getClient(id!),
        adminApi.getClientConfig(id!),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/client-modules/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('nestchat_admin_token')}` }
        }).then(r => r.json()),
        adminApi.getKnowledge(id!),
        adminApi.getFAQs({ clientId: id! }),
        adminApi.getWebsiteContent(id!),
      ]);
      
      if (clientRes.status === 'fulfilled') setClient(clientRes.value);
      if (configRes.status === 'fulfilled') setConfig(configRes.value);
      if (modulesRes.status === 'fulfilled') setModules(modulesRes.value?.data || []);

      const kCount = knowledgeRes.status === 'fulfilled' ? (knowledgeRes.value?.data?.length || knowledgeRes.value?.items?.length || 0) : 0;
      const fCount = faqRes.status === 'fulfilled' ? (faqRes.value?.data?.total || faqRes.value?.data?.faqs?.length || 0) : 0;
      const wData = websiteRes.status === 'fulfilled' ? websiteRes.value : null;

      setSyncStats({
        status: syncing ? 'syncing' : (wData?.items?.length ? 'completed' : 'idle'),
        lastSync: wData?.updatedAt ? new Date(wData.updatedAt).toLocaleString() : (wData?.lastSyncAt ? new Date(wData.lastSyncAt).toLocaleString() : null),
        pagesIndexed: wData?.pagesScraped || wData?.items?.length || 0,
        knowledgeCount: kCount,
        faqCount: fCount,
      });
    } catch (error) {
      console.error('Failed to fetch client details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncWebsite = async () => {
    try {
      setSyncing(true);
      setSyncResult(null);
      const result = await adminApi.syncWebsite(id!);
      const data = result.data || result;
      setSyncResult(data);
      setSyncStats(prev => ({
        ...prev,
        status: data.success ? 'completed' : 'failed',
        lastSync: new Date().toLocaleString(),
        pagesIndexed: data.pagesScraped || data.itemsExtracted || prev.pagesIndexed,
      }));
    } catch (error) {
      setSyncResult({ success: false, error: 'Failed to sync website' });
      setSyncStats(prev => ({ ...prev, status: 'failed' }));
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleModule = async (moduleName: string, enabled: boolean) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/client-modules/${id}/${moduleName}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('nestchat_admin_token')}` 
        },
        body: JSON.stringify({ enabled }),
      });
      setModules(modules.map(m => 
        m.name === moduleName ? { ...m, enabled } : m
      ));
    } catch (error) {
      console.error('Failed to toggle module:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500 text-sm">Loading client details...</div>;
  }

  if (!client) {
    return <div className="text-center py-12 text-gray-500 text-sm">Client not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">{client.companyName}</h1>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              ID: {client.clientId}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{client.name} &bull; {client.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/clients/${id}/edit`}
            className="bg-blue-600 text-white px-3.5 py-2 rounded-xl hover:bg-blue-700 font-medium text-xs sm:text-sm transition-colors min-h-[40px] flex items-center justify-center shadow-sm"
          >
            Edit Client
          </Link>
          <Link
            to={`/clients/${client.clientId}/widget`}
            className="bg-green-600 text-white px-3.5 py-2 rounded-xl hover:bg-green-700 font-medium text-xs sm:text-sm transition-colors min-h-[40px] flex items-center justify-center shadow-sm"
          >
            Widget
          </Link>
          <Link
            to={`/clients/${id}/theme`}
            className="bg-purple-600 text-white px-3.5 py-2 rounded-xl hover:bg-purple-700 font-medium text-xs sm:text-sm transition-colors min-h-[40px] flex items-center justify-center shadow-sm"
          >
            Theme
          </Link>
          <Link
            to={`/clients/${id}/config`}
            className="bg-orange-600 text-white px-3.5 py-2 rounded-xl hover:bg-orange-700 font-medium text-xs sm:text-sm transition-colors min-h-[40px] flex items-center justify-center shadow-sm"
          >
            Config
          </Link>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors min-h-[44px] flex items-center ${activeTab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors min-h-[44px] flex items-center ${activeTab === 'config' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Configuration
          </button>
          <button
            onClick={() => setActiveTab('modules')}
            className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors min-h-[44px] flex items-center ${activeTab === 'modules' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Modules
          </button>
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Overview Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <span className="text-xs text-gray-500 font-medium">Sync Status</span>
              <div className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${
                  syncStats.status === 'completed' ? 'bg-green-100 text-green-800' :
                  syncStats.status === 'syncing' ? 'bg-blue-100 text-blue-800 animate-pulse' :
                  syncStats.status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {syncing ? 'Syncing...' : syncStats.status}
                </span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <span className="text-xs text-gray-500 font-medium">Last Sync</span>
              <p className="text-sm font-semibold text-gray-900 mt-1 truncate">
                {syncStats.lastSync || 'Never'}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <span className="text-xs text-gray-500 font-medium">Pages Indexed</span>
              <p className="text-xl font-bold text-blue-600 mt-0.5">{syncStats.pagesIndexed}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <span className="text-xs text-gray-500 font-medium">Knowledge Count</span>
              <p className="text-xl font-bold text-purple-600 mt-0.5">{syncStats.knowledgeCount}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <span className="text-xs text-gray-500 font-medium">FAQ Count</span>
              <p className="text-xl font-bold text-emerald-600 mt-0.5">{syncStats.faqCount}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Client Details</h2>
              <dl className="space-y-3 text-xs sm:text-sm">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <dt className="text-gray-500 font-medium">Name:</dt>
                  <dd className="font-semibold text-gray-900">{client.name}</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <dt className="text-gray-500 font-medium">Client ID:</dt>
                  <dd className="font-mono text-blue-600 font-semibold">{client.clientId}</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <dt className="text-gray-500 font-medium">Email:</dt>
                  <dd className="font-medium text-gray-900">{client.email}</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <dt className="text-gray-500 font-medium">Phone:</dt>
                  <dd className="font-medium text-gray-900">{client.phone || '-'}</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <dt className="text-gray-500 font-medium">Website:</dt>
                  <dd className="font-medium text-blue-600">{client.website || '-'}</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <dt className="text-gray-500 font-medium">Type:</dt>
                  <dd className="font-medium text-gray-900 capitalize">{client.websiteType}</dd>
                </div>
                <div className="flex justify-between py-1">
                  <dt className="text-gray-500 font-medium">Status:</dt>
                  <dd>
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full capitalize ${
                      client.status === 'active' ? 'bg-green-100 text-green-800' :
                      client.status === 'suspended' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {client.status}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Widget Settings</h2>
              <dl className="space-y-3 text-xs sm:text-sm">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <dt className="text-gray-500 font-medium">Bot Name:</dt>
                  <dd className="font-semibold text-gray-900">{client.botName}</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <dt className="text-gray-500 font-medium">Language:</dt>
                  <dd className="font-medium text-gray-900 uppercase">{client.defaultLanguage}</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <dt className="text-gray-500 font-medium">Timezone:</dt>
                  <dd className="font-medium text-gray-900">{client.timezone}</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <dt className="text-gray-500 font-medium">Primary Color:</dt>
                  <dd className="flex items-center gap-2 font-mono">
                    <div className="w-5 h-5 rounded border border-gray-200" style={{ backgroundColor: client.primaryColor }}></div>
                    {client.primaryColor}
                  </dd>
                </div>
                <div className="flex justify-between py-1">
                  <dt className="text-gray-500 font-medium">Secondary Color:</dt>
                  <dd className="flex items-center gap-2 font-mono">
                    <div className="w-5 h-5 rounded border border-gray-200" style={{ backgroundColor: client.secondaryColor }}></div>
                    {client.secondaryColor}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Website Sync</h2>
            <p className="text-xs sm:text-sm text-gray-500 mb-4">
              Sync website content to automatically index pages, menus, pricing, contact info, and knowledge base items.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <button
                onClick={handleSyncWebsite}
                disabled={syncing || !client.website}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-semibold min-h-[44px] shadow-sm transition-colors"
              >
                {syncing ? 'Syncing Website...' : 'Sync Website Content'}
              </button>
              {!client.website && (
                <span className="text-xs text-red-500 font-medium">No website URL configured for this client</span>
              )}
            </div>
            {syncResult && (
              <div className={`mt-4 p-3.5 rounded-xl text-xs sm:text-sm ${
                syncResult.success
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {syncResult.success
                  ? `Successfully synced ${syncResult.itemsExtracted || 0} items from ${syncResult.pagesScraped || 0} pages`
                  : syncResult.error || 'Sync failed'}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'config' && config && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Configuration</h2>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-gray-500 text-sm">Greeting Message</dt>
              <dd className="font-medium">{config.greetingMessage}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-sm">Widget Position</dt>
              <dd className="font-medium">{config.widgetPosition}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-sm">Widget Style</dt>
              <dd className="font-medium">{config.widgetStyle}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-sm">Theme</dt>
              <dd className="font-medium">{config.theme}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-sm">Fallback Message</dt>
              <dd className="font-medium">{config.fallbackMessage}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-sm">Business Hours</dt>
              <dd className="font-medium">{config.businessHours || '-'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-sm">Quick Actions</dt>
              <dd className="font-medium">{config.quickActions.join(', ')}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-sm">Allowed Languages</dt>
              <dd className="font-medium">{config.allowedLanguages.join(', ')}</dd>
            </div>
          </dl>
          <div className="mt-4">
            <Link
              to={`/clients/${id}/config/edit`}
              className="text-blue-600 hover:text-blue-800"
            >
              Edit Configuration
            </Link>
          </div>
        </div>
      )}

      {activeTab === 'modules' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Modules</h2>
          <div className="space-y-3">
            {modules.map((module) => (
              <div key={module.name} className="flex items-center justify-between py-2 border-b">
                <span className="font-medium">{module.name}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={module.enabled}
                    onChange={(e) => handleToggleModule(module.name, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
