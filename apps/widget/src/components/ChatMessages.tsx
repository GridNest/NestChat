import React from 'react';
import { Message } from '../types';
import { ChatMessage } from './ChatMessage';
import { QuickActions } from './QuickActions';
import { useWidgetStore } from '../store/chatStore';

interface ChatMessagesProps {
  messages: Message[];
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const { clientConfig } = useWidgetStore();

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <React.Fragment key={message.id}>
          <ChatMessage message={message} />
          {message.quickActions && message.quickActions.length > 0 && (
            <QuickActions actions={message.quickActions} />
          )}
        </React.Fragment>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
