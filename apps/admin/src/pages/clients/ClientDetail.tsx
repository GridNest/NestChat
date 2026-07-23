import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { adminApi } from '../../services/api';

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

  useEffect(() => {
    if (id) {
      fetchClientData();
    }
  }, [id]);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      const [clientRes, configRes, modulesRes] = await Promise.all([
        adminApi.getClient(id!),
        adminApi.getClientConfig(id!),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/client-modules/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('nestchat_admin_token')}` }
        }).then(r => r.json()),
      ]);
      
      setClient(clientRes);
      setConfig(configRes);
      setModules(modulesRes.data);
    } catch (error) {
      console.error('Failed to fetch client:', error);
    } finally {
      setLoading(false);
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
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!client) {
    return <div className="text-center py-8">Client not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{client.companyName}</h1>
          <p className="text-gray-500">Client ID: {client.clientId}</p>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/clients/${id}/edit`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Edit Client
          </Link>
          <Link
            to={`/clients/${id}/theme`}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            Theme
          </Link>
        </div>
      </div>

      <div className="border-b">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2 ${activeTab === 'overview' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`pb-2 ${activeTab === 'config' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          >
            Configuration
          </button>
          <button
            onClick={() => setActiveTab('modules')}
            className={`pb-2 ${activeTab === 'modules' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          >
            Modules
          </button>
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Client Details</h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-gray-500">Name:</dt>
                <dd className="font-medium">{client.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Email:</dt>
                <dd className="font-medium">{client.email}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Phone:</dt>
                <dd className="font-medium">{client.phone || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Website:</dt>
                <dd className="font-medium">{client.website || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Type:</dt>
                <dd className="font-medium">{client.websiteType}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Status:</dt>
                <dd>
                  <span className={`px-2 py-1 text-xs rounded-full ${
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

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Widget Settings</h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-gray-500">Bot Name:</dt>
                <dd className="font-medium">{client.botName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Language:</dt>
                <dd className="font-medium">{client.defaultLanguage}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Timezone:</dt>
                <dd className="font-medium">{client.timezone}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Primary Color:</dt>
                <dd className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: client.primaryColor }}></div>
                  {client.primaryColor}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Secondary Color:</dt>
                <dd className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: client.secondaryColor }}></div>
                  {client.secondaryColor}
                </dd>
              </div>
            </dl>
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
