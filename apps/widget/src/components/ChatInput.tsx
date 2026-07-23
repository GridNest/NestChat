import React, { useState } from 'react';
import { useWidgetStore } from '../store/chatStore';

export function ChatInput() {
  const [input, setInput] = useState('');
  const { sendMessage, clientConfig, language } = useWidgetStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input.trim());
      setInput('');
    }
  };

  const placeholder = language === 'hi' ? 'Apna message likhein...' : 'Type your message...';

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t bg-gray-50">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:border-blue-500 text-sm"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="px-4 py-2 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: clientConfig?.brandColor || '#3B82F6' }}
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
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>
      </div>
    </form>
  );
}
