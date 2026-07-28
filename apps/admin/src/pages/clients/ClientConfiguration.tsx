import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminApi } from '../../services/api';

interface ClientConfigForm {
  quickActions: string;
  businessName: string;
  websiteUrl: string;
  supportEmail: string;
  phone: string;
  whatsapp: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  welcomeMessage: string;
  botName: string;
  botAvatar: string;
  theme: 'light' | 'dark' | 'auto';
  language: 'en' | 'hi';
  timezone: string;
  officeHours: string;
  fallbackMessage: string;
  humanHandoverMessage: string;
  collectVisitorName: boolean;
  collectEmail: boolean;
  collectPhone: boolean;
  enableChatHistory: boolean;
  enableFAQs: boolean;
  enableKnowledgeBase: boolean;
  enableInquiryForm: boolean;
  enableLiveAgent: boolean;
  enableAnalytics: boolean;
  enableAI: boolean;
  enableWebsiteSync: boolean;
}

const DEFAULT_FORM: ClientConfigForm = {
  quickActions: 'Menu, Pricing, Contact, Hours, FAQ',
  businessName: '',
  websiteUrl: '',
  supportEmail: '',
  phone: '',
  whatsapp: '',
  logo: '',
  primaryColor: '#3B82F6',
  secondaryColor: '#1E40AF',
  welcomeMessage: 'Hello! How can I help you today?',
  botName: 'Assistant',
  botAvatar: '',
  theme: 'light',
  language: 'en',
  timezone: 'Asia/Kolkata',
  officeHours: '',
  fallbackMessage: 'Let me connect you with our team.',
  humanHandoverMessage: 'Let me connect you with our team.',
  collectVisitorName: false,
  collectEmail: false,
  collectPhone: false,
  enableChatHistory: true,
  enableFAQs: true,
  enableKnowledgeBase: true,
  enableInquiryForm: true,
  enableLiveAgent: true,
  enableAnalytics: true,
  enableAI: true,
  enableWebsiteSync: false,
};

export function ClientConfiguration() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<ClientConfigForm>(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (id) fetchConfig();
  }, [id]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const client = await adminApi.getClient(id!);
      const config = await adminApi.getClientConfig(id!);

      setForm({
        quickActions: (config.quickActions || DEFAULT_FORM.quickActions).join(', '),
        businessName: client.companyName || '',
        websiteUrl: client.website || '',
        supportEmail: config.contactEmail || client.email || '',
        phone: client.phone || '',
        whatsapp: config.whatsapp || '',
        logo: client.logo || '',
        primaryColor: client.primaryColor || '#3B82F6',
        secondaryColor: client.secondaryColor || '#1E40AF',
        welcomeMessage: config.greetingMessage || DEFAULT_FORM.welcomeMessage,
        botName: client.botName || 'Assistant',
        botAvatar: config.avatarUrl || client.logo || '',
        theme: config.theme || 'light',
        language: client.defaultLanguage || 'en',
        timezone: client.timezone || 'Asia/Kolkata',
        officeHours: config.businessHours || '',
        fallbackMessage: config.fallbackMessage || DEFAULT_FORM.fallbackMessage,
        humanHandoverMessage: config.humanHandoverMessage || DEFAULT_FORM.humanHandoverMessage,
        collectVisitorName: config.collectVisitorName ?? false,
        collectEmail: config.collectEmail ?? false,
        collectPhone: config.collectPhone ?? false,
        enableChatHistory: config.enableChatHistory ?? true,
        enableFAQs: config.enableFAQs ?? true,
        enableKnowledgeBase: config.enableKnowledgeBase ?? true,
        enableInquiryForm: config.enableInquiryForm ?? true,
        enableLiveAgent: config.enableLiveAgent ?? true,
        enableAnalytics: config.enableAnalytics ?? true,
        enableAI: config.enableAI ?? true,
        enableWebsiteSync: config.enableWebsiteSync ?? false,
      });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load configuration' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      await adminApi.updateClient(id!, {
        companyName: form.businessName,
        website: form.websiteUrl,
        phone: form.phone,
        logo: form.logo || undefined,
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
        botName: form.botName,
        defaultLanguage: form.language,
        timezone: form.timezone,
      });

      await adminApi.updateClientConfig(id!, {
        quickActions: form.quickActions.split(',').map(s => s.trim()).filter(Boolean),
        greetingMessage: form.welcomeMessage,
        avatarUrl: form.botAvatar || undefined,
        businessHours: form.officeHours || undefined,
        contactEmail: form.supportEmail || undefined,
        contactPhone: form.phone || undefined,
        fallbackMessage: form.fallbackMessage,
        humanHandoverMessage: form.humanHandoverMessage,
        theme: form.theme,
        whatsapp: form.whatsapp || undefined,
        collectVisitorName: form.collectVisitorName,
        collectEmail: form.collectEmail,
        collectPhone: form.collectPhone,
        enableChatHistory: form.enableChatHistory,
        enableFAQs: form.enableFAQs,
        enableKnowledgeBase: form.enableKnowledgeBase,
        enableInquiryForm: form.enableInquiryForm,
        enableLiveAgent: form.enableLiveAgent,
        enableAnalytics: form.enableAnalytics,
        enableAI: form.enableAI,
        enableWebsiteSync: form.enableWebsiteSync,
      });

      setMessage({ type: 'success', text: 'Configuration saved successfully' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save configuration' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset configuration to defaults? This cannot be undone.')) return;
    try {
      setResetting(true);
      await adminApi.resetClientConfig(id!);
      await fetchConfig();
      setMessage({ type: 'success', text: 'Configuration reset to defaults' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to reset configuration' });
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading configuration...</div>;
  }

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
  const sectionClass = 'bg-white p-6 rounded-lg shadow';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Client Configuration</h1>
          <p className="text-gray-500">Configure all settings for this client</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            disabled={resetting}
            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
          >
            {resetting ? 'Resetting...' : 'Reset'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={sectionClass}>
          <h2 className="text-lg font-semibold mb-4">Business Information</h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Business Name</label>
              <input type="text" name="businessName" value={form.businessName} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Website URL</label>
              <input type="url" name="websiteUrl" value={form.websiteUrl} onChange={handleChange} className={inputClass} placeholder="https://example.com" />
            </div>
            <div>
              <label className={labelClass}>Support Email</label>
              <input type="email" name="supportEmail" value={form.supportEmail} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>WhatsApp</label>
              <input type="tel" name="whatsapp" value={form.whatsapp} onChange={handleChange} className={inputClass} placeholder="+1234567890" />
            </div>
          </div>
        </div>

        <div className={sectionClass}>
          <h2 className="text-lg font-semibold mb-4">Branding</h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Logo URL</label>
              <input type="url" name="logo" value={form.logo} onChange={handleChange} className={inputClass} placeholder="https://example.com/logo.png" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Primary Color</label>
                <div className="flex gap-2 items-center">
                  <input type="color" name="primaryColor" value={form.primaryColor} onChange={handleChange} className="w-10 h-10 rounded cursor-pointer" />
                  <input type="text" name="primaryColor" value={form.primaryColor} onChange={handleChange} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Secondary Color</label>
                <div className="flex gap-2 items-center">
                  <input type="color" name="secondaryColor" value={form.secondaryColor} onChange={handleChange} className="w-10 h-10 rounded cursor-pointer" />
                  <input type="text" name="secondaryColor" value={form.secondaryColor} onChange={handleChange} className={inputClass} />
                </div>
              </div>
            </div>
            <div>
              <label className={labelClass}>Bot Name</label>
              <input type="text" name="botName" value={form.botName} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Bot Avatar URL</label>
              <input type="url" name="botAvatar" value={form.botAvatar} onChange={handleChange} className={inputClass} placeholder="https://example.com/avatar.png" />
            </div>
          </div>
        </div>

        <div className={sectionClass}>
          <h2 className="text-lg font-semibold mb-4">Chat Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Welcome Message</label>
              <textarea name="welcomeMessage" value={form.welcomeMessage} onChange={handleChange} rows={3} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Theme</label>
              <select name="theme" value={form.theme} onChange={handleChange} className={inputClass}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Language</label>
                <select name="language" value={form.language} onChange={handleChange} className={inputClass}>
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Timezone</label>
                <select name="timezone" value={form.timezone} onChange={handleChange} className={inputClass}>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="America/Chicago">America/Chicago (CST)</option>
                  <option value="America/Denver">America/Denver (MST)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="Europe/Paris">Europe/Paris (CET)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                  <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                  <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Office Hours</label>
              <input type="text" name="officeHours" value={form.officeHours} onChange={handleChange} className={inputClass} placeholder="Mon-Fri, 9AM-6PM" />
            </div>
            <div>
              <label className={labelClass}>Quick Action Buttons</label>
              <input type="text" name="quickActions" value={form.quickActions} onChange={handleChange} className={inputClass} placeholder="Menu, Pricing, Contact, Hours" />
              <p className="text-xs text-gray-500 mt-1">Comma-separated list of quick action button labels shown to visitors</p>
            </div>
          </div>
        </div>

        <div className={sectionClass}>
          <h2 className="text-lg font-semibold mb-4">Fallback & Handover</h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Fallback Response</label>
              <textarea name="fallbackMessage" value={form.fallbackMessage} onChange={handleChange} rows={3} className={inputClass} />
              <p className="text-xs text-gray-500 mt-1">Shown when the bot cannot answer a question</p>
            </div>
            <div>
              <label className={labelClass}>Human Handover Message</label>
              <textarea name="humanHandoverMessage" value={form.humanHandoverMessage} onChange={handleChange} rows={3} className={inputClass} />
              <p className="text-xs text-gray-500 mt-1">Shown when handing over to a human agent</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className={sectionClass}>
            <h2 className="text-lg font-semibold mb-4">Feature Toggles</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { key: 'collectVisitorName', label: 'Collect Visitor Name' },
                { key: 'collectEmail', label: 'Collect Email' },
                { key: 'collectPhone', label: 'Collect Phone' },
                { key: 'enableChatHistory', label: 'Chat History' },
                { key: 'enableFAQs', label: 'FAQs' },
                { key: 'enableKnowledgeBase', label: 'Knowledge Base' },
                { key: 'enableInquiryForm', label: 'Inquiry Form' },
                { key: 'enableLiveAgent', label: 'Live Agent' },
                { key: 'enableAnalytics', label: 'Analytics' },
                { key: 'enableAI', label: 'AI Responses' },
                { key: 'enableWebsiteSync', label: 'Website Sync' },
              ].map(feature => (
                <label key={feature.key} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    name={feature.key}
                    checked={(form as any)[feature.key]}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">{feature.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
