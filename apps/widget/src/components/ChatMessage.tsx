import React from 'react';
import { Message } from '../types';
import { useWidgetStore } from '../store/chatStore';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const { clientConfig } = useWidgetStore();
  const isBot = message.sender === 'bot';

  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} w-full`}>
      <div
        className={`max-w-[85%] sm:max-w-[80%] px-3.5 py-2.5 rounded-2xl break-words overflow-wrap-anywhere ${
          isBot
            ? 'bg-gray-100 text-gray-800 rounded-bl-xs'
            : 'text-white rounded-br-xs'
        }`}
        style={
          !isBot
            ? { backgroundColor: clientConfig?.theme?.primaryColor || '#3B82F6' }
            : undefined
        }
      >
        <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed break-words">{message.content}</p>
        <p
          className={`text-[10px] sm:text-xs mt-1 ${
            isBot ? 'text-gray-400' : 'text-white/80'
          }`}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}

