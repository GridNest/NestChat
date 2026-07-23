import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminApi } from '../../services/api';

interface ThemeData {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  widgetStyle: string;
  borderRadius: string;
  fontFamily: string;
  fontSize: string;
  botAvatar?: string;
  companyLogo?: string;
  darkMode: string;
}

export function ClientTheme() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState<ThemeData>({
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF',
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
    borderColor: '#E5E7EB',
    widgetStyle: 'bubble',
    borderRadius: '12px',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    darkMode: 'light',
  });

  useEffect(() => {
    if (id) {
      fetchTheme();
    }
  }, [id]);

  const fetchTheme = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/client-themes/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('nestchat_admin_token')}` }
      });
      const data = await response.json();
      setTheme(data.data);
    } catch (error) {
      console.error('Failed to fetch theme:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/client-themes/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('nestchat_admin_token')}` 
        },
        body: JSON.stringify(theme),
      });
      alert('Theme saved successfully');
    } catch (error) {
      console.error('Failed to save theme:', error);
      alert('Failed to save theme');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setTheme({ ...theme, [e.target.name]: e.target.value });
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Theme Settings</h1>
        <button
          onClick={() => navigate(`/clients/${id}`)}
          className="text-gray-600 hover:text-gray-800"
        >
          Back to Client
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Colors</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  name="primaryColor"
                  value={theme.primaryColor}
                  onChange={handleChange}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  name="primaryColor"
                  value={theme.primaryColor}
                  onChange={handleChange}
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  name="secondaryColor"
                  value={theme.secondaryColor}
                  onChange={handleChange}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  name="secondaryColor"
                  value={theme.secondaryColor}
                  onChange={handleChange}
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  name="backgroundColor"
                  value={theme.backgroundColor}
                  onChange={handleChange}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  name="backgroundColor"
                  value={theme.backgroundColor}
                  onChange={handleChange}
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  name="textColor"
                  value={theme.textColor}
                  onChange={handleChange}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  name="textColor"
                  value={theme.textColor}
                  onChange={handleChange}
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Border Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  name="borderColor"
                  value={theme.borderColor}
                  onChange={handleChange}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  name="borderColor"
                  value={theme.borderColor}
                  onChange={handleChange}
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Widget Style</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Widget Style</label>
              <select
                name="widgetStyle"
                value={theme.widgetStyle}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="bubble">Bubble</option>
                <option value="tab">Tab</option>
                <option value="inline">Inline</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Border Radius</label>
              <input
                type="text"
                name="borderRadius"
                value={theme.borderRadius}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Font Family</label>
              <input
                type="text"
                name="fontFamily"
                value={theme.fontFamily}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
              <input
                type="text"
                name="fontSize"
                value={theme.fontSize}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dark Mode</label>
              <select
                name="darkMode"
                value={theme.darkMode}
                onChange={handleChange}
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
          <h2 className="text-lg font-semibold mb-4">Preview</h2>
          <div 
            className="p-4 rounded-lg border"
            style={{ 
              backgroundColor: theme.backgroundColor,
              borderColor: theme.borderColor,
              color: theme.textColor,
              fontFamily: theme.fontFamily,
              fontSize: theme.fontSize,
              borderRadius: theme.borderRadius,
            }}
          >
            <div 
              className="p-3 rounded-lg text-white"
              style={{ backgroundColor: theme.primaryColor }}
            >
              Hello! How can I help you today?
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate(`/clients/${id}`)}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Theme'}
          </button>
        </div>
      </form>
    </div>
  );
}
