import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { adminApi } from '../../services/api';

interface WidgetConfig {
  client: {
    clientId: string;
    companyName: string;
    botName: string;
    logo?: string;
  };
  theme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    borderRadius: string;
  };
  config: {
    greetingMessage: string;
    quickActions: string[];
  };
}

export function WidgetPreview() {
  const { clientId } = useParams<{ clientId: string }>();
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [darkMode, setDarkMode] = useState(false);
  const [widgetOpen, setWidgetOpen] = useState(true);

  useEffect(() => {
    if (clientId) {
      fetchConfig();
    }
  }, [clientId]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getWidgetConfig(clientId!);
      setConfig(response.data);
    } catch (error) {
      console.error('Failed to fetch config:', error);
    } finally {
      setLoading(false);
    }
  };

  const deviceSizes = {
    desktop: { width: '100%', height: '600px' },
    tablet: { width: '768px', height: '600px' },
    mobile: { width: '375px', height: '600px' },
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!config) {
    return <div className="text-center py-8">Config not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Widget Preview</h1>
        <div className="flex gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setDevice('desktop')}
              className={`px-3 py-1 rounded ${device === 'desktop' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            >
              Desktop
            </button>
            <button
              onClick={() => setDevice('tablet')}
              className={`px-3 py-1 rounded ${device === 'tablet' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            >
              Tablet
            </button>
            <button
              onClick={() => setDevice('mobile')}
              className={`px-3 py-1 rounded ${device === 'mobile' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            >
              Mobile
            </button>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={darkMode}
              onChange={(e) => setDarkMode(e.target.checked)}
              className="rounded"
            />
            Dark Mode
          </label>
        </div>
      </div>

      <div className="flex justify-center">
        <div
          className={`relative border rounded-lg overflow-hidden shadow-lg ${
            darkMode ? 'bg-gray-900' : 'bg-gray-100'
          }`}
          style={{
            width: deviceSizes[device].width,
            height: deviceSizes[device].height,
            maxWidth: '100%',
          }}
        >
          {/* Mock website content */}
          <div className={`p-8 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            <h2 className="text-2xl font-bold mb-4">Sample Website</h2>
            <p className="mb-4">This is a preview of how the widget will look on your website.</p>
            <div className="space-y-2">
              <div className={`h-4 w-3/4 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
              <div className={`h-4 w-1/2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
              <div className={`h-4 w-2/3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
            </div>
          </div>

          {/* Widget Bubble */}
          {!widgetOpen && (
            <div
              className="absolute bottom-5 right-5 w-14 h-14 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-transform hover:scale-110"
              style={{ backgroundColor: config.theme.primaryColor }}
              onClick={() => setWidgetOpen(true)}
            >
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
              </svg>
            </div>
          )}

          {/* Widget Panel */}
          {widgetOpen && (
            <div
              className="absolute bottom-5 right-5 flex flex-col overflow-hidden shadow-2xl transition-all duration-300"
              style={{
                width: '380px',
                height: '520px',
                borderRadius: config.theme.borderRadius,
                backgroundColor: config.theme.backgroundColor,
                maxWidth: 'calc(100% - 40px)',
                maxHeight: 'calc(100% - 40px)',
              }}
            >
              {/* Header */}
              <div
                className="p-4 flex items-center gap-3"
                style={{ backgroundColor: config.theme.primaryColor }}
              >
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                  {config.client.logo ? (
                    <img src={config.client.logo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold">{config.client.botName}</h3>
                  <p className="text-white/80 text-sm">{config.client.companyName}</p>
                </div>
                <button
                  className="text-white/80 hover:text-white"
                  onClick={() => setWidgetOpen(false)}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                <div className="max-w-[80%] p-3 rounded-xl bg-gray-100 text-gray-800 rounded-bl-sm">
                  {config.config.greetingMessage}
                </div>
              </div>

              {/* Quick Actions */}
              {config.config.quickActions && config.config.quickActions.length > 0 && (
                <div className="px-4 pb-3 flex flex-wrap gap-2">
                  {config.config.quickActions.map((action, index) => (
                    <button
                      key={index}
                      className="px-3 py-1.5 text-sm border rounded-full hover:bg-gray-100 transition-colors"
                      style={{ borderColor: config.theme.primaryColor, color: config.theme.primaryColor }}
                    >
                      {action}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="p-3 border-t flex gap-2 bg-white">
                <input
                  type="text"
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border rounded-full text-sm focus:outline-none focus:border-blue-500"
                />
                <button
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: config.theme.primaryColor }}
                >
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                </button>
              </div>

              {/* Powered By */}
              <div className="text-center py-2 text-xs text-gray-400 bg-gray-50">
                Powered by <span className="text-blue-500">NestChat</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
