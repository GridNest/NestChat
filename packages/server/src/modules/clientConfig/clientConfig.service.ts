import { UpdateClientConfigRequest, WidgetConfigResponse } from '@nestchat/shared';
import { ClientConfigModel, ClientConfigDocument } from './clientConfig.model';
import { ClientModel } from '../client/client.model';
import { ApiError } from '../../utils/apiError';
import { omitUndefined } from '../../utils/helpers';
import { DEFAULT_QUICK_ACTIONS } from '@nestchat/shared';

export interface ClientConfigListItem {
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
  inquiryApiUrl?: string;
  inquiryApiKey?: string;
  isActive: boolean;
}

export class ClientConfigService {
  static async getByClientId(clientId: string): Promise<ClientConfigListItem> {
    const config = await ClientConfigModel.findOne({ clientId });
    if (!config) {
      throw ApiError.notFound('Client config not found');
    }
    return this.formatConfig(config);
  }

  static async update(clientId: string, data: UpdateClientConfigRequest): Promise<ClientConfigListItem> {
    let config = await ClientConfigModel.findOne({ clientId });
    
    if (!config) {
      config = await ClientConfigModel.create({
        clientId,
        ...data,
      });
    } else {
      const updateData = omitUndefined(data as Record<string, any>);
      Object.assign(config, updateData);
      await config.save();
    }

    return this.formatConfig(config);
  }

  static async getWidgetConfig(clientId: string): Promise<WidgetConfigResponse> {
    const [client, config] = await Promise.all([
      ClientModel.findById(clientId),
      ClientConfigModel.findOne({ clientId }),
    ]);

    if (!client) {
      throw ApiError.notFound('Client not found');
    }

    if (!config) {
      throw ApiError.notFound('Widget not configured');
    }

    return {
      clientName: client.name,
      logo: config.logo,
      brandColor: config.brandColor,
      secondaryColor: config.secondaryColor,
      botName: config.botName,
      greetingMessage: config.greetingMessage,
      theme: config.theme,
      position: config.position,
      defaultLanguage: config.defaultLanguage,
      allowedLanguages: config.allowedLanguages,
      quickActions: DEFAULT_QUICK_ACTIONS,
    };
  }

  static async getAll(): Promise<ClientConfigListItem[]> {
    const configs = await ClientConfigModel.find({ isActive: true })
      .populate('clientId', 'name')
      .lean();
    return configs.map(config => this.formatConfig(config as unknown as ClientConfigDocument));
  }

  private static formatConfig(config: ClientConfigDocument): ClientConfigListItem {
    return {
      id: config._id.toString(),
      clientId: config.clientId.toString(),
      logo: config.logo,
      brandColor: config.brandColor,
      secondaryColor: config.secondaryColor,
      botName: config.botName,
      greetingMessage: config.greetingMessage,
      theme: config.theme,
      position: config.position,
      defaultLanguage: config.defaultLanguage,
      allowedLanguages: config.allowedLanguages,
      inquiryApiUrl: config.inquiryApiUrl,
      inquiryApiKey: config.inquiryApiKey,
      isActive: config.isActive,
    };
  }
}
