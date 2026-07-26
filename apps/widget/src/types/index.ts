export interface WidgetState {
  isOpen: boolean;
  language: string;
  messages: Message[];
  isTyping: boolean;
  currentView: 'chat' | 'inquiry';
  clientConfig: ServerWidgetConfig | null;
  sessionId: string;
  chatId: string | null;
  inquiryStep: string;
  inquiryData: Record<string, string>;
}

export interface ServerWidgetConfig {
  client: {
    clientId: string;
    name: string;
    companyName: string;
    logo?: string;
    botName: string;
  };
  theme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    borderColor: string;
    widgetStyle: string;
    borderRadius: string;
    fontFamily: string;
    fontSize: string;
    botAvatar?: string;
    companyLogo?: string;
    darkMode: string;
  };
  config: {
    greetingMessage: string;
    widgetPosition: string;
    widgetStyle: string;
    theme: string;
    quickActions: string[];
    businessHours?: string;
    contactEmail?: string;
    contactPhone?: string;
    contactAddress?: string;
    fallbackMessage: string;
    allowedLanguages: string[];
  };
  modules: Array<{ name: string; enabled: boolean; config: Record<string, any> }>;
  language: string;
  translations: Record<string, Record<string, string>>;
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

export function getWidgetTranslation(config: ServerWidgetConfig | null, language: string, key: string, fallback: string): string {
  if (!config) return fallback;
  const langTranslations = config.translations?.[language];
  if (langTranslations?.[key]) return langTranslations[key];
  return fallback;
}