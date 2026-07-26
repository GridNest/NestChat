import React from 'react';
import { useWidgetStore } from '../store/chatStore';
import { getMessage, LANGUAGES } from '@nestchat/shared';
import { getWidgetTranslation } from '../types';

export function WelcomeScreen() {
  const { clientConfig, language, setLanguage, sendMessage } = useWidgetStore();

  if (!clientConfig) return null;

  const greeting = getMessage(language, 'greeting', {
    clientName: clientConfig.client.name,
  });

  const primaryColor = clientConfig.theme.primaryColor || '#3B82F6';
  const allowedLanguages = clientConfig.config.allowedLanguages || ['en'];

  return (
    <div className="text-center py-8">
      <div className="text-4xl mb-4">👋</div>
      <h2 className="text-lg font-semibold text-gray-800 mb-2">
        {getWidgetTranslation(clientConfig, language, 'welcome', 'Welcome to NestChat')}
      </h2>
      <p className="text-sm text-gray-600 mb-6 whitespace-pre-line">{greeting}</p>

      <div className="flex justify-center gap-3 flex-wrap">
        {allowedLanguages.map((lang) => {
          const langInfo = (LANGUAGES as Record<string, { code: string; name: string; nativeName: string }>)[lang];
          const isActive = language === lang;
          return (
            <button
              key={lang}
              onClick={() => {
                setLanguage(lang);
                sendMessage(lang === 'hi' ? 'Namaste' : 'Hi');
              }}
              className={`px-6 py-2 rounded-full font-medium transition-colors ${
                isActive
                  ? 'text-white'
                  : 'border-2 hover:bg-gray-50'
              }`}
              style={{
                ...(isActive
                  ? { backgroundColor: primaryColor }
                  : { borderColor: primaryColor, color: primaryColor }
                ),
              }}
            >
              {langInfo?.name || lang.toUpperCase()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
