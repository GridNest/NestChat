export type WebsiteType = 
  | 'corporate' 
  | 'restaurant' 
  | 'hotel' 
  | 'school' 
  | 'hospital' 
  | 'real_estate' 
  | 'portfolio' 
  | 'agency' 
  | 'landing_page' 
  | 'ecommerce';

export type ClientStatus = 'active' | 'inactive' | 'suspended';

export type ModuleName = 
  | 'FAQ' 
  | 'Knowledge' 
  | 'Inquiry' 
  | 'Gallery' 
  | 'Menu' 
  | 'Rooms' 
  | 'Products' 
  | 'Services' 
  | 'Portfolio' 
  | 'Blog' 
  | 'Events' 
  | 'Booking' 
  | 'Contact';

export interface Client {
  _id: string;
  clientId: string;
  name: string;
  email: string;
  companyName: string;
  phone?: string;
  website?: string;
  websiteType: WebsiteType;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  botName: string;
  defaultLanguage: 'en' | 'hi';
  timezone: string;
  status: ClientStatus;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientResponse {
  id: string;
  clientId?: string;
  name: string;
  email: string;
  companyName: string;
  phone?: string;
  website?: string;
  websiteType?: WebsiteType;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  botName?: string;
  defaultLanguage?: 'en' | 'hi';
  timezone?: string;
  status?: ClientStatus;
  isActive: boolean;
  createdAt: Date;
}

export interface CreateClientRequest {
  name: string;
  email: string;
  companyName: string;
  phone?: string;
  website?: string;
  websiteType?: WebsiteType;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  botName?: string;
  defaultLanguage?: 'en' | 'hi';
  timezone?: string;
}

export interface UpdateClientRequest {
  name?: string;
  companyName?: string;
  phone?: string;
  website?: string;
  websiteType?: WebsiteType;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  botName?: string;
  defaultLanguage?: 'en' | 'hi';
  timezone?: string;
  status?: ClientStatus;
  isActive?: boolean;
}

export interface ClientTheme {
  _id: string;
  clientId: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  widgetStyle: 'bubble' | 'tab' | 'inline';
  borderRadius: string;
  fontFamily: string;
  fontSize: string;
  botAvatar?: string;
  companyLogo?: string;
  darkMode: 'light' | 'dark' | 'auto';
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateClientThemeRequest {
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  widgetStyle?: 'bubble' | 'tab' | 'inline';
  borderRadius?: string;
  fontFamily?: string;
  fontSize?: string;
  botAvatar?: string;
  companyLogo?: string;
  darkMode?: 'light' | 'dark' | 'auto';
}

export interface ClientModule {
  _id: string;
  clientId: string;
  name: ModuleName;
  enabled: boolean;
  config: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateClientModulesRequest {
  modules: {
    name: ModuleName;
    enabled: boolean;
    config?: Record<string, any>;
  }[];
}

export interface WebsiteConnector {
  _id: string;
  clientId: string;
  websiteName: string;
  websiteType: WebsiteType;
  knowledgeSource: 'manual' | 'url' | 'file';
  inquiryApiEndpoint?: string;
  enabledModules: ModuleName[];
  theme: ThemeConfig;
  language: 'en' | 'hi';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  widgetStyle: 'bubble' | 'tab' | 'inline';
  borderRadius: string;
  fontFamily: string;
}

export interface Role {
  _id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

export interface UserRole {
  _id: string;
  userId: string;
  clientId: string;
  roleId: string;
  assignedBy: string;
  createdAt: Date;
  updatedAt: Date;
}
