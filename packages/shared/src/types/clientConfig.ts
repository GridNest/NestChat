export type WidgetPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
export type WidgetStyle = 'bubble' | 'tab' | 'inline';
export type ThemeMode = 'light' | 'dark' | 'auto';

export interface ClientConfig {
  _id: string;
  clientId: string;
  avatarUrl?: string;
  greetingMessage: string;
  widgetPosition: WidgetPosition;
  widgetStyle: WidgetStyle;
  theme: ThemeMode;
  quickActions: string[];
  businessHours?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  fallbackMessage: string;
  humanHandoverMessage: string;
  allowedLanguages: string[];
  inquiryApiUrl?: string;
  inquiryApiKey?: string;
  whatsapp?: string;
  collectVisitorName: boolean;
  collectEmail: boolean;
  collectPhone: boolean;
  enableChatHistory: boolean;
  enableFAQs: boolean;
  enableKnowledgeBase: boolean;
  enableInquiryForm: boolean;
  enableLiveAgent: boolean;
  enableAnalytics: boolean;
  enableWebsiteSync?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientConfigResponse {
  id: string;
  clientId: string;
  avatarUrl?: string;
  greetingMessage: string;
  widgetPosition: WidgetPosition;
  widgetStyle: WidgetStyle;
  theme: ThemeMode;
  quickActions: string[];
  businessHours?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  fallbackMessage: string;
  humanHandoverMessage: string;
  allowedLanguages: string[];
  whatsapp?: string;
  collectVisitorName: boolean;
  collectEmail: boolean;
  collectPhone: boolean;
  enableChatHistory: boolean;
  enableFAQs: boolean;
  enableKnowledgeBase: boolean;
  enableInquiryForm: boolean;
  enableLiveAgent: boolean;
  enableAnalytics: boolean;
  enableWebsiteSync?: boolean;
}

export interface UpdateClientConfigRequest {
  avatarUrl?: string;
  greetingMessage?: string;
  widgetPosition?: WidgetPosition;
  widgetStyle?: WidgetStyle;
  theme?: ThemeMode;
  quickActions?: string[];
  businessHours?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  fallbackMessage?: string;
  humanHandoverMessage?: string;
  allowedLanguages?: ('en' | 'hi')[];
  inquiryApiUrl?: string;
  inquiryApiKey?: string;
  whatsapp?: string;
  collectVisitorName?: boolean;
  collectEmail?: boolean;
  collectPhone?: boolean;
  enableChatHistory?: boolean;
  enableFAQs?: boolean;
  enableKnowledgeBase?: boolean;
  enableInquiryForm?: boolean;
  enableLiveAgent?: boolean;
  enableAnalytics?: boolean;
  enableWebsiteSync?: boolean;
}

export interface WidgetConfigResponse {
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
    avatarUrl?: string;
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
    humanHandoverMessage: string;
    allowedLanguages: string[];
    whatsapp?: string;
    collectVisitorName: boolean;
    collectEmail: boolean;
    collectPhone: boolean;
    enableChatHistory: boolean;
    enableFAQs: boolean;
    enableKnowledgeBase: boolean;
    enableInquiryForm: boolean;
    enableLiveAgent: boolean;
    enableAnalytics: boolean;
    enableWebsiteSync?: boolean;
  };
  modules: {
    name: string;
    enabled: boolean;
    config: Record<string, any>;
  }[];
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
