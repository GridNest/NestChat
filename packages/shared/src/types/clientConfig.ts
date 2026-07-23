export interface ClientConfig {
  _id: string;
  clientId: string;
  logo?: string;
  brandColor: string;
  secondaryColor: string;
  botName: string;
  greetingMessage: string;
  theme: 'light' | 'dark';
  position: 'bottom-right' | 'bottom-left';
  defaultLanguage: 'en' | 'hi';
  allowedLanguages: ('en' | 'hi')[];
  inquiryApiUrl?: string;
  inquiryApiKey?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientConfigResponse {
  id: string;
  clientId: string;
  logo?: string;
  brandColor: string;
  secondaryColor: string;
  botName: string;
  greetingMessage: string;
  theme: 'light' | 'dark';
  position: 'bottom-right' | 'bottom-left';
  defaultLanguage: 'en' | 'hi';
  allowedLanguages: ('en' | 'hi')[];
  isActive: boolean;
}

export interface UpdateClientConfigRequest {
  logo?: string;
  brandColor?: string;
  secondaryColor?: string;
  botName?: string;
  greetingMessage?: string;
  theme?: 'light' | 'dark';
  position?: 'bottom-right' | 'bottom-left';
  defaultLanguage?: 'en' | 'hi';
  allowedLanguages?: ('en' | 'hi')[];
  inquiryApiUrl?: string;
  inquiryApiKey?: string;
  isActive?: boolean;
}

export interface WidgetConfigResponse {
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
