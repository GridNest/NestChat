import { ClientModel } from '../client/client.model.js';
import { ClientService } from '../client/client.service.js';
import { ClientConfigModel } from '../clientConfig/clientConfig.model.js';
import { ClientThemeModel } from '../clientTheme/clientTheme.model.js';
import { ClientModuleModel } from '../clientModule/clientModule.model.js';
import { TranslationService } from '../translation/translation.service.js';
import { ApiError } from '../../utils/apiError.js';

export interface WidgetConfig {
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
    humanHandoverMessage?: string;
    allowedLanguages: string[];
    whatsapp?: string;
    avatarUrl?: string;
    collectVisitorName: boolean;
    collectEmail: boolean;
    collectPhone: boolean;
    enableChatHistory: boolean;
    enableFAQs: boolean;
    enableKnowledgeBase: boolean;
    enableInquiryForm: boolean;
    enableLiveAgent: boolean;
    enableAnalytics: boolean;
    enableAI: boolean;
    enableWebsiteSync: boolean;
  };
  modules: {
    name: string;
    enabled: boolean;
    config: Record<string, any>;
  }[];
  language: string;
  translations: Record<string, Record<string, string>>;
}

export class WidgetConfigService {
  static async loadConfig(clientId: string): Promise<WidgetConfig> {
    const client = await ClientModel.findOne({ 
      clientId: clientId.trim().toLowerCase(), 
      isActive: true 
    });
    if (!client) {
      throw new ApiError(404, 'Client not found or inactive');
    }

    const [config, theme, modules, translations] = await Promise.all([
      ClientConfigModel.findOne({ clientId: client._id }),
      ClientThemeModel.findOne({ clientId: client._id }),
      ClientModuleModel.find({ clientId: client._id }),
      TranslationService.getByClientAsMap(client._id.toString()),
    ]);

    const activeConfig = config || {
      greetingMessage: 'Hello! How can I assist you today?',
      widgetPosition: 'bottom-right',
      widgetStyle: 'bubble',
      theme: 'light',
      quickActions: ['Menu', 'Reservations', 'Hours'],
      businessHours: '12:00 PM - 11:30 PM',
      contactEmail: client.email,
      contactPhone: client.phone || '',
      contactAddress: '',
      fallbackMessage: 'Let me connect you with our team.',
      humanHandoverMessage: 'Let me connect you with our team.',
      allowedLanguages: [client.defaultLanguage || 'en'],
      whatsapp: client.phone || '',
      collectVisitorName: false,
      collectEmail: false,
      collectPhone: false,
      enableChatHistory: true,
      enableFAQs: true,
      enableKnowledgeBase: true,
      enableInquiryForm: true,
      enableLiveAgent: true,
        enableAI: true,
        enableWebsiteSync: false,
        enableAnalytics: true,
      };

    return {
      client: {
        clientId: client.clientId,
        name: client.name,
        companyName: client.companyName,
        logo: client.logo,
        botName: client.botName,
      },
      theme: theme ? {
        primaryColor: theme.primaryColor,
        secondaryColor: theme.secondaryColor,
        backgroundColor: theme.backgroundColor,
        textColor: theme.textColor,
        borderColor: theme.borderColor,
        widgetStyle: theme.widgetStyle,
        borderRadius: theme.borderRadius,
        fontFamily: theme.fontFamily,
        fontSize: theme.fontSize,
        botAvatar: (config as any)?.avatarUrl || theme.botAvatar || client.logo || '',
        companyLogo: theme.companyLogo,
        darkMode: theme.darkMode,
      } : {
        primaryColor: client.primaryColor || '#3B82F6',
        secondaryColor: client.secondaryColor || '#1E40AF',
        backgroundColor: '#FFFFFF',
        textColor: '#1F2937',
        borderColor: '#E5E7EB',
        widgetStyle: activeConfig.widgetStyle,
        borderRadius: '12px',
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        botAvatar: (config as any)?.avatarUrl || client.logo || '',
        darkMode: activeConfig.theme,
      },
      config: {
        greetingMessage: activeConfig.greetingMessage,
        widgetPosition: activeConfig.widgetPosition,
        widgetStyle: activeConfig.widgetStyle,
        theme: activeConfig.theme,
        quickActions: activeConfig.quickActions,
        businessHours: activeConfig.businessHours,
        contactEmail: activeConfig.contactEmail,
        contactPhone: activeConfig.contactPhone,
        contactAddress: activeConfig.contactAddress,
        fallbackMessage: activeConfig.fallbackMessage,
        humanHandoverMessage: activeConfig.humanHandoverMessage,
        allowedLanguages: activeConfig.allowedLanguages,
        whatsapp: activeConfig.whatsapp,
        avatarUrl: (config as any)?.avatarUrl || theme?.botAvatar || client.logo || '',
        collectVisitorName: activeConfig.collectVisitorName,
        collectEmail: activeConfig.collectEmail,
        collectPhone: activeConfig.collectPhone,
        enableChatHistory: activeConfig.enableChatHistory,
        enableFAQs: activeConfig.enableFAQs,
        enableKnowledgeBase: activeConfig.enableKnowledgeBase,
        enableInquiryForm: activeConfig.enableInquiryForm,
        enableLiveAgent: activeConfig.enableLiveAgent,
        enableAnalytics: activeConfig.enableAnalytics,
        enableAI: activeConfig.enableAI,
        enableWebsiteSync: activeConfig.enableWebsiteSync,
      },
      modules: modules.map((mod: any) => ({
        name: mod.name,
        enabled: mod.enabled,
        config: mod.config,
      })),
      language: client.defaultLanguage,
      translations,
    };
  }
}
