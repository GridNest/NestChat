export type WidgetPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
export type WidgetStyle = 'bubble' | 'tab' | 'inline';
export type ThemeMode = 'light' | 'dark' | 'auto';

export interface ClientConfig {
  _id: string;
  clientId: string;
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
  allowedLanguages: ('en' | 'hi')[];
  inquiryApiUrl?: string;
  inquiryApiKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientConfigResponse {
  id: string;
  clientId: string;
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
  allowedLanguages: string[];
}

export interface UpdateClientConfigRequest {
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
  allowedLanguages?: ('en' | 'hi')[];
  inquiryApiUrl?: string;
  inquiryApiKey?: string;
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
  modules: {
    name: string;
    enabled: boolean;
    config: Record<string, any>;
  }[];
  language: string;
}

export interface QuickAction {
  id: string;
  label: string;
  labelHi?: string;
  icon: string;
  action: string;
}
