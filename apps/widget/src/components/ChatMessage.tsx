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
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[80%] px-4 py-2 rounded-2xl ${
          isBot
            ? 'bg-gray-100 text-gray-800 rounded-bl-none'
            : 'text-white rounded-br-none'
        }`}
        style={
          !isBot
            ? { backgroundColor: clientConfig?.brandColor || '#3B82F6' }
            : undefined
        }
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <p
          className={`text-xs mt-1 ${
            isBot ? 'text-gray-500' : 'text-white/70'
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
