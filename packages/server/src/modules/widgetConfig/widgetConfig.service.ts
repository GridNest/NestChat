import { ClientModel } from '../client/client.model';
import { ClientConfigModel } from '../clientConfig/clientConfig.model';
import { ClientThemeModel } from '../clientTheme/clientTheme.model';
import { ClientModuleModel } from '../clientModule/clientModule.model';
import { ApiError } from '../../utils/apiError';

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
    allowedLanguages: string[];
  };
  modules: {
    name: string;
    enabled: boolean;
    config: Record<string, any>;
  }[];
  language: string;
}

export class WidgetConfigService {
  static async loadConfig(clientId: string): Promise<WidgetConfig> {
    const client = await ClientModel.findOne({ clientId, isActive: true });
    if (!client) {
      throw new ApiError(404, 'Client not found or inactive');
    }

    const [config, theme, modules] = await Promise.all([
      ClientConfigModel.findOne({ clientId: client._id }),
      ClientThemeModel.findOne({ clientId: client._id }),
      ClientModuleModel.find({ clientId: client._id }),
    ]);

    if (!config) {
      throw new ApiError(404, 'Client configuration not found');
    }

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
        botAvatar: theme.botAvatar,
        companyLogo: theme.companyLogo,
        darkMode: theme.darkMode,
      } : {
        primaryColor: client.primaryColor,
        secondaryColor: client.secondaryColor,
        backgroundColor: '#FFFFFF',
        textColor: '#1F2937',
        borderColor: '#E5E7EB',
        widgetStyle: config.widgetStyle,
        borderRadius: '12px',
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        darkMode: config.theme,
      },
      config: {
        greetingMessage: config.greetingMessage,
        widgetPosition: config.widgetPosition,
        widgetStyle: config.widgetStyle,
        theme: config.theme,
        quickActions: config.quickActions,
        businessHours: config.businessHours,
        contactEmail: config.contactEmail,
        contactPhone: config.contactPhone,
        contactAddress: config.contactAddress,
        fallbackMessage: config.fallbackMessage,
        allowedLanguages: config.allowedLanguages,
      },
      modules: modules.map(mod => ({
        name: mod.name,
        enabled: mod.enabled,
        config: mod.config,
      })),
      language: client.defaultLanguage,
    };
  }
}
