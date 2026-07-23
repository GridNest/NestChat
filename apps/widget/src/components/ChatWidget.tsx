import React from 'react';
import { useWidgetStore } from '../store/chatStore';
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { WelcomeScreen } from './WelcomeScreen';
import { InquiryForm } from './InquiryForm';
import { TypingIndicator } from './TypingIndicator';

interface ChatWidgetProps {
  clientId: string;
}

export function ChatWidget({ clientId }: ChatWidgetProps) {
  const { isOpen, messages, isTyping, currentView, clientConfig } = useWidgetStore();

  React.useEffect(() => {
    useWidgetStore.getState().initializeChat(clientId);
  }, [clientId]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed bottom-24 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50"
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <ChatHeader />
      
      <div className="flex-1 overflow-y-auto p-4">
        {currentView === 'inquiry' ? (
          <InquiryForm />
        ) : messages.length === 0 ? (
          <WelcomeScreen />
        ) : (
          <ChatMessages messages={messages} />
        )}
        {isTyping && <TypingIndicator />}
      </div>

      <ChatInput />
    </div>
  );
}
