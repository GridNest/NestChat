import React from 'react';
import { useWidgetStore } from '../store/chatStore';

export function WidgetButton() {
  const { toggleWidget, isOpen, clientConfig } = useWidgetStore();

  return (
    <button
      onClick={toggleWidget}
      aria-label={isOpen ? "Close Chat Widget" : "Open Chat Widget"}
      className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] right-4 sm:right-6 w-14 h-14 text-white rounded-full shadow-lg hover:shadow-2xl active:scale-95 transition-all duration-300 flex items-center justify-center z-50 min-w-[56px] min-h-[56px]"
      style={{
        backgroundColor: clientConfig?.theme?.primaryColor || '#3B82F6',
      }}
    >
      {isOpen ? (
        <svg
          className="w-6 h-6"
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
      ) : (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      )}
    </button>
  );
}

