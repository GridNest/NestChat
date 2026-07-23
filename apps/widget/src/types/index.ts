export interface WidgetState {
  isOpen: boolean;
  language: 'en' | 'hi';
  messages: Message[];
  isTyping: boolean;
  currentView: 'chat' | 'inquiry';
  clientConfig: WidgetConfig | null;
  sessionId: string;
  chatId: string | null;
  inquiryStep: string;
  inquiryData: Record<string, string>;
}

export interface WidgetConfig {
  clientName: string;
  logo?: string;
  brandColor: string;
  secondaryColor: string;
  botName: string;
  greetingMessage: string;
  theme: 'light' | 'dark';
  position: 'bottom-right' | 'bottom-left';
  defaultLanguage: 'en' | 'hi';
  allowedLanguages: ('en' | 'hi')[];
  quickActions: QuickAction[];
}

export interface QuickAction {
  id: string;
  label: string;
  labelHi?: string;
  icon: string;
  action: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'bot';
  content: string;
  timestamp: Date;
  quickActions?: QuickAction[];
}

export interface ChatResponse {
  userMessage: Message;
  botMessage: Message;
}

export interface StartChatResponse {
  chatId: string;
  sessionId: string;
  welcomeMessage: Message;
}
