import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';
import { adminApi } from '../../services/api';

interface WidgetScript {
  script: string;
  clientId: string;
  version: string;
  secretKey: string;
}

interface InstallationGuide {
  platform: string;
  instructions: string;
  code: string;
}

export function WidgetGenerator() {
  const { clientId } = useParams<{ clientId: string }>();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [script, setScript] = useState<WidgetScript | null>(null);
  const [guides, setGuides] = useState<InstallationGuide[]>([]);
  const [activeTab, setActiveTab] = useState<'script' | 'guides' | 'settings' | 'domains'>('script');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (clientId) {
      fetchData();
    }
  }, [clientId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [scriptRes, guidesRes] = await Promise.all([
        adminApi.getWidgetScript(clientId!),
        adminApi.getInstallationGuides(clientId!),
      ]);
      setScript(scriptRes.data);
      setGuides(guidesRes.data);
    } catch (error) {
      console.error('Failed to fetch widget data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyScript = () => {
    if (script) {
      navigator.clipboard.writeText(script.script);
      setCopied(true);
      addToast('success', 'Script copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRegenerateKey = async () => {
    if (!confirm('Are you sure you want to regenerate the secret key? This will invalidate the previous key.')) {
      return;
    }

    try {
      await adminApi.regenerateWidgetSecretKey(clientId!);
      addToast('success', 'Secret key regenerated');
      fetchData();
    } catch (error) {
      addToast('error', 'Failed to regenerate key');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Widget Generator</h1>
          <p className="text-gray-500">Client ID: {clientId}</p>
        </div>
      </div>

      <div className="border-b">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('script')}
            className={`pb-2 ${activeTab === 'script' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          >
            Widget Script
          </button>
          <button
            onClick={() => setActiveTab('guides')}
            className={`pb-2 ${activeTab === 'guides' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          >
            Installation Guides
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-2 ${activeTab === 'settings' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          >
            Widget Settings
          </button>
          <button
            onClick={() => setActiveTab('domains')}
            className={`pb-2 ${activeTab === 'domains' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          >
            Allowed Domains
          </button>
        </nav>
      </div>

      {activeTab === 'script' && script && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Embed Script</h2>
            <p className="text-gray-600 mb-4">
              Copy this script and paste it before the closing &lt;/body&gt; tag on your website.
            </p>
            <div className="relative">
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                {script.script}
              </pre>
              <button
                onClick={handleCopyScript}
                className="absolute top-2 right-2 bg-gray-700 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Widget Info</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-gray-500">Client ID</dt>
                <dd className="font-mono">{script.clientId}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Version</dt>
                <dd className="font-mono">{script.version}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Secret Key</dt>
                <dd className="font-mono text-xs break-all">{script.secretKey}</dd>
              </div>
            </dl>
            <button
              onClick={handleRegenerateKey}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Regenerate Secret Key
            </button>
          </div>
        </div>
      )}

      {activeTab === 'guides' && (
        <div className="space-y-6">
          {guides.map((guide) => (
            <div key={guide.platform} className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">{guide.platform}</h3>
              <p className="text-gray-600 mb-4">{guide.instructions}</p>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                {guide.code}
              </pre>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'settings' && (
        <WidgetSettingsTab clientId={clientId!} />
      )}

      {activeTab === 'domains' && (
        <AllowedDomainsTab clientId={clientId!} />
      )}
    </div>
  );
}

function WidgetSettingsTab({ clientId }: { clientId: string }) {
  const { addToast } = useToast();
  const [settings, setSettings] = useState({
    position: 'bottom-right',
    width: '380px',
    height: '520px',
    borderRadius: '16px',
    autoOpen: false,
    autoOpenDelay: 3000,
    showNotificationBadge: true,
    allowLocalhost: true,
  });

  useEffect(() => {
    fetchSettings();
  }, [clientId]);

  const fetchSettings = async () => {
    try {
      const response = await adminApi.getWidgetInfo(clientId);
      if (response.data?.widgetSettings) {
        setSettings(response.data.widgetSettings);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleSave = async () => {
    try {
      await adminApi.updateWidgetSettings(clientId, settings);
      addToast('success', 'Settings saved');
    } catch (error) {
      addToast('error', 'Failed to save settings');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Widget Settings</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
          <select
            value={settings.position}
            onChange={(e) => setSettings({ ...settings, position: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="bottom-right">Bottom Right</option>
            <option value="bottom-left">Bottom Left</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Width</label>
          <input
            type="text"
            value={settings.width}
            onChange={(e) => setSettings({ ...settings, width: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
          <input
            type="text"
            value={settings.height}
            onChange={(e) => setSettings({ ...settings, height: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Border Radius</label>
          <input
            type="text"
            value={settings.borderRadius}
            onChange={(e) => setSettings({ ...settings, borderRadius: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Auto Open Delay (ms)</label>
          <input
            type="number"
            value={settings.autoOpenDelay}
            onChange={(e) => setSettings({ ...settings, autoOpenDelay: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.autoOpen}
              onChange={(e) => setSettings({ ...settings, autoOpen: e.target.checked })}
              className="rounded"
            />
            Auto Open
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.showNotificationBadge}
              onChange={(e) => setSettings({ ...settings, showNotificationBadge: e.target.checked })}
              className="rounded"
            />
            Show Badge
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.allowLocalhost}
              onChange={(e) => setSettings({ ...settings, allowLocalhost: e.target.checked })}
              className="rounded"
            />
            Allow Localhost
          </label>
        </div>
      </div>
      <button
        onClick={handleSave}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Save Settings
      </button>
    </div>
  );
}

function AllowedDomainsTab({ clientId }: { clientId: string }) {
  const { addToast } = useToast();
  const [domains, setDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState('');

  useEffect(() => {
    fetchDomains();
  }, [clientId]);

  const fetchDomains = async () => {
    try {
      const response = await adminApi.getWidgetInfo(clientId);
      if (response.data?.allowedDomains) {
        setDomains(response.data.allowedDomains);
      }
    } catch (error) {
      console.error('Failed to fetch domains:', error);
    }
  };

  const handleAddDomain = async () => {
    if (!newDomain.trim()) return;

    try {
      await adminApi.addAllowedDomain(clientId, newDomain.trim());
      setDomains([...domains, newDomain.trim()]);
      setNewDomain('');
      addToast('success', 'Domain added');
    } catch (error) {
      addToast('error', 'Failed to add domain');
    }
  };

  const handleRemoveDomain = async (domain: string) => {
    try {
      await adminApi.removeAllowedDomain(clientId, domain);
      setDomains(domains.filter(d => d !== domain));
      addToast('success', 'Domain removed');
    } catch (error) {
      addToast('error', 'Failed to remove domain');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Allowed Domains</h2>
      <p className="text-gray-600 mb-4">
        Add domains where the widget is allowed to load. Leave empty to allow all domains.
      </p>
      
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newDomain}
          onChange={(e) => setNewDomain(e.target.value)}
          placeholder="example.com"
          className="flex-1 px-3 py-2 border rounded-lg"
          onKeyPress={(e) => e.key === 'Enter' && handleAddDomain()}
        />
        <button
          onClick={handleAddDomain}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Add Domain
        </button>
      </div>

      <div className="space-y-2">
        {domains.length === 0 ? (
          <p className="text-gray-500">No domains configured. Widget will load on all domains.</p>
        ) : (
          domains.map((domain) => (
            <div key={domain} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="font-mono">{domain}</span>
              <button
                onClick={() => handleRemoveDomain(domain)}
                className="text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
