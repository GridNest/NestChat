import React from 'react';
import { useWidgetStore } from '../store/chatStore';

export function ChatHeader() {
  const { clientConfig, closeWidget, language, setLanguage } = useWidgetStore();

  if (!clientConfig) return null;

  return (
    <div
      className="p-4 text-white flex items-center justify-between"
      style={{ backgroundColor: clientConfig.brandColor }}
    >
      <div className="flex items-center gap-3">
        {clientConfig.logo && (
          <img
            src={clientConfig.logo}
            alt={clientConfig.clientName}
            className="w-10 h-10 rounded-full object-cover"
          />
        )}
        <div>
          <h3 className="font-semibold">{clientConfig.botName}</h3>
          <p className="text-xs opacity-90">{clientConfig.clientName}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {clientConfig.allowedLanguages.length > 1 && (
          <div className="flex gap-1">
            {clientConfig.allowedLanguages.map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-2 py-1 text-xs rounded ${
                  language === lang
                    ? 'bg-white text-blue-600'
                    : 'bg-white/20 hover:bg-white/30'
                }`}
              >
                {lang === 'en' ? 'EN' : 'HI'}
              </button>
            ))}
          </div>
        )}
        
        <button
          onClick={closeWidget}
          className="p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
