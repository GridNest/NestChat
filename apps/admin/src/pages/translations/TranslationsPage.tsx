import React, { useState, useEffect } from 'react';
import { useToast } from '../../components/ui/Toast';
import { adminApi } from '../../services/api';
import { LANGUAGES, DEFAULT_TRANSLATION_KEYS } from '@nestchat/shared';

interface TranslationEntry {
  language: string;
  key: string;
  value: string;
}

const LANG_LIST = Object.entries(LANGUAGES).map(([code, lang]) => ({
  code,
  name: lang.name,
  nativeName: lang.nativeName,
}));

export function TranslationsPage() {
  const [clientId, setClientId] = useState('');
  const [translations, setTranslations] = useState<TranslationEntry[]>([]);
  const [selectedLang, setSelectedLang] = useState('en');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const { addToast } = useToast();
  const defaultKeys: string[] = DEFAULT_TRANSLATION_KEYS as unknown as string[];

  useEffect(() => {
    loadClientId();
  }, []);

  useEffect(() => {
    if (clientId) fetchTranslations();
  }, [clientId, selectedLang]);

  const loadClientId = async () => {
    try {
      const id = await adminApi.getCurrentClientId();
      setClientId(id);
    } catch {
      addToast('error', 'Failed to load client');
    }
  };

  const fetchTranslations = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getTranslations(clientId, selectedLang);
      const data = response.data || response;
      const items: TranslationEntry[] = (Array.isArray(data) ? data : []).map((t: any) => ({
        language: t.language,
        key: t.key,
        value: t.value,
      }));
      setTranslations(items);

      const editMap: Record<string, string> = {};
      for (const key of defaultKeys) {
        const existing = items.find(t => t.key === key);
        editMap[key] = existing?.value || '';
      }
      setEditing(editMap);
    } catch {
      addToast('error', 'Failed to load translations');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const entries = defaultKeys
        .filter(key => editing[key]?.trim())
        .map(key => ({ language: selectedLang, key, value: editing[key].trim() }));

      const result = await adminApi.bulkUpsertTranslations(clientId, entries);
      addToast('success', result.data?.message || 'Translations saved');
      fetchTranslations();
    } catch {
      addToast('error', 'Failed to save translations');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLanguage = async () => {
    if (!confirm(`Delete all ${selectedLang.toUpperCase()} translations?`)) return;
    try {
      await adminApi.deleteTranslationLanguage(clientId, selectedLang);
      addToast('success', 'Translations deleted');
      fetchTranslations();
    } catch {
      addToast('error', 'Failed to delete translations');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Translations</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-4 mb-6">
          <label className="font-medium">Language:</label>
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            {LANG_LIST.map(l => (
              <option key={l.code} value={l.code}>{l.name} ({l.nativeName})</option>
            ))}
          </select>
          {translations.length > 0 && (
            <button onClick={handleDeleteLanguage} className="text-sm text-red-600 hover:text-red-800 px-3 py-2">
              Clear {selectedLang.toUpperCase()} translations
            </button>
          )}
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-600">
            Customize widget messages for <strong>{selectedLang.toUpperCase()}</strong>. 
            Leave a field empty to use the default English message as fallback.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading translations...</div>
        ) : (
          <div className="space-y-3">
            {defaultKeys.map(key => (
              <div key={key} className="grid grid-cols-1 gap-1">
                <label className="text-sm font-medium text-gray-700 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                <input
                  type="text"
                  value={editing[key] || ''}
                  onChange={(e) => setEditing(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder={`Default (en): ${getDefaultMessage(key)}`}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={fetchTranslations} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !clientId}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Translations'}
          </button>
        </div>
      </div>
    </div>
  );
}

function getDefaultMessage(key: string): string {
  const msgs: Record<string, string> = {
    welcome: 'Hello! Welcome to {botName}. How can I help you today?',
    greeting: 'Hello! Welcome to NestChat',
    unknownResponse: "I couldn't find the exact information.",
    inquiryPrompt: "Sure! I'll help you with that.",
    inquiryName: "What's your name?",
    inquiryEmail: "What's your email address?",
    inquiryPhone: "What's your phone number?",
    inquiryCountry: "Which country are you from?",
    inquiryState: "Which state are you in?",
    inquiryService: "Which service are you interested in?",
    inquiryDetails: "Please describe your project requirements.",
    inquiryCompany: "What's your company name? (Optional)",
    inquiryComplete: "Thank you! Our team will contact you within 24 hours.",
    inquiryCancelled: "No problem! Feel free to ask if you have any other questions.",
    invalidEmail: "Please enter a valid email address.",
    invalidPhone: "Please enter a valid phone number.",
    requiredField: "This field is required.",
    tryAgain: "Please try again.",
    endChat: "Chat ended. Thank you for visiting!",
    typeMessage: "Type your message...",
    send: "Send",
    end: "End Chat",
  };
  return msgs[key] || '';
}
