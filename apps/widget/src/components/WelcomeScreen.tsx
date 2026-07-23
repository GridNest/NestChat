import React from 'react';
import { useWidgetStore } from '../store/chatStore';
import { getMessage } from '@nestchat/shared';

export function WelcomeScreen() {
  const { clientConfig, language, setLanguage, sendMessage } = useWidgetStore();

  if (!clientConfig) return null;

  const greeting = getMessage(language, 'greeting', {
    clientName: clientConfig.clientName,
  });

  return (
    <div className="text-center py-8">
      <div className="text-4xl mb-4">👋</div>
      <h2 className="text-lg font-semibold text-gray-800 mb-2">
        {language === 'hi' ? 'NestChat mein aapka swagat hai' : 'Welcome to NestChat'}
      </h2>
      <p className="text-sm text-gray-600 mb-6 whitespace-pre-line">{greeting}</p>

      <div className="flex justify-center gap-3">
        <button
          onClick={() => {
            setLanguage('en');
            sendMessage('Hi');
          }}
          className="px-6 py-2 border-2 rounded-full font-medium transition-colors hover:bg-gray-50"
          style={{
            borderColor: clientConfig.brandColor,
            color: clientConfig.brandColor,
          }}
        >
          English
        </button>
        <button
          onClick={() => {
            setLanguage('hi');
            sendMessage('Namaste');
          }}
          className="px-6 py-2 text-white rounded-full font-medium transition-colors hover:opacity-90"
          style={{
            backgroundColor: clientConfig.brandColor,
          }}
        >
          Hindi
        </button>
      </div>
    </div>
  );
}
