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

    const interval = setInterval(() => {
      if (useWidgetStore.getState().isOpen) {
        useWidgetStore.getState().syncChatHistory();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [clientId]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] right-3 sm:right-6 left-3 sm:left-auto w-[calc(100vw-24px)] sm:w-[90vw] md:w-[420px] h-[80vh] max-h-[700px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 transition-all duration-300 ease-out border border-gray-100"
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <ChatHeader />
      
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
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

