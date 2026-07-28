import React, { useState } from 'react';
import { useWidgetStore } from '../store/chatStore';
import { getWidgetTranslation } from '../types';

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

  const placeholder = getWidgetTranslation(clientConfig, language, 'typeMessage', 'Type your message...');
  const primaryColor = clientConfig?.theme?.primaryColor || '#3B82F6';

  return (
    <form onSubmit={handleSubmit} className="p-3 sm:p-4 border-t border-gray-100 bg-gray-50/80 flex-shrink-0">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-full focus:outline-none focus:border-blue-500 focus:bg-white text-xs sm:text-sm bg-white transition-all min-h-[44px]"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          aria-label="Send Message"
          className="w-11 h-11 text-white rounded-full transition-all flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 active:scale-95 shadow-sm min-w-[44px] min-h-[44px]"
          style={{ backgroundColor: primaryColor }}
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

