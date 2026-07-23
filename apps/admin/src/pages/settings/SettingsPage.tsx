import React, { useState, useEffect } from 'react';
import { useToast } from '../../components/ui/Toast';
import { adminApi } from '../../services/api';

interface Settings {
  companyName: string;
  supportEmail: string;
  supportPhone: string;
  timezone: string;
  businessHours: string;
  widgetDefaults: {
    primaryColor: string;
    secondaryColor: string;
    greetingMessage: string;
    botName: string;
    position: string;
    theme: string;
  };
  allowedLanguages: string[];
  defaultLanguage: string;
}

export function SettingsPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    companyName: '',
    supportEmail: '',
    supportPhone: '',
    timezone: 'Asia/Kolkata',
    businessHours: '',
    widgetDefaults: {
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      greetingMessage: 'Hello! How can I help you today?',
      botName: 'Assistant',
      position: 'bottom-right',
      theme: 'light',
    },
    allowedLanguages: ['en', 'hi'],
    defaultLanguage: 'en',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getSettings();
      setSettings(response);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await adminApi.updateSettings(settings);
      addToast('success', 'Settings saved successfully');
    } catch (error) {
      addToast('error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Company Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Support Phone</label>
              <input
                type="text"
                value={settings.supportPhone}
                onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Hours</label>
              <input
                type="text"
                value={settings.businessHours}
                onChange={(e) => setSettings({ ...settings, businessHours: e.target.value })}
                placeholder="9:00 AM - 6:00 PM"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Widget Defaults</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings.widgetDefaults.primaryColor}
                  onChange={(e) => setSettings({
                    ...settings,
                    widgetDefaults: { ...settings.widgetDefaults, primaryColor: e.target.value }
                  })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.widgetDefaults.primaryColor}
                  onChange={(e) => setSettings({
                    ...settings,
                    widgetDefaults: { ...settings.widgetDefaults, primaryColor: e.target.value }
                  })}
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings.widgetDefaults.secondaryColor}
                  onChange={(e) => setSettings({
                    ...settings,
                    widgetDefaults: { ...settings.widgetDefaults, secondaryColor: e.target.value }
                  })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.widgetDefaults.secondaryColor}
                  onChange={(e) => setSettings({
                    ...settings,
                    widgetDefaults: { ...settings.widgetDefaults, secondaryColor: e.target.value }
                  })}
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Greeting Message</label>
              <input
                type="text"
                value={settings.widgetDefaults.greetingMessage}
                onChange={(e) => setSettings({
                  ...settings,
                  widgetDefaults: { ...settings.widgetDefaults, greetingMessage: e.target.value }
                })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bot Name</label>
              <input
                type="text"
                value={settings.widgetDefaults.botName}
                onChange={(e) => setSettings({
                  ...settings,
                  widgetDefaults: { ...settings.widgetDefaults, botName: e.target.value }
                })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
              <select
                value={settings.widgetDefaults.position}
                onChange={(e) => setSettings({
                  ...settings,
                  widgetDefaults: { ...settings.widgetDefaults, position: e.target.value }
                })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="top-right">Top Right</option>
                <option value="top-left">Top Left</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
              <select
                value={settings.widgetDefaults.theme}
                onChange={(e) => setSettings({
                  ...settings,
                  widgetDefaults: { ...settings.widgetDefaults, theme: e.target.value }
                })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Language Settings</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Language</label>
              <select
                value={settings.defaultLanguage}
                onChange={(e) => setSettings({ ...settings, defaultLanguage: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Allowed Languages</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.allowedLanguages.includes('en')}
                    onChange={(e) => {
                      const langs = e.target.checked
                        ? [...settings.allowedLanguages, 'en']
                        : settings.allowedLanguages.filter(l => l !== 'en');
                      setSettings({ ...settings, allowedLanguages: langs });
                    }}
                  />
                  English
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.allowedLanguages.includes('hi')}
                    onChange={(e) => {
                      const langs = e.target.checked
                        ? [...settings.allowedLanguages, 'hi']
                        : settings.allowedLanguages.filter(l => l !== 'hi');
                      setSettings({ ...settings, allowedLanguages: langs });
                    }}
                  />
                  Hindi
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
