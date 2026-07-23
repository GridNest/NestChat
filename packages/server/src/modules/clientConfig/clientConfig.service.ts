import { UpdateClientConfigRequest } from '@nestchat/shared';
import { ClientConfigModel, ClientConfigDocument } from './clientConfig.model';
import { ApiError } from '../../utils/apiError';
import { omitUndefined } from '../../utils/helpers';

export interface ClientConfigResponse {
  id: string;
  clientId: string;
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
  inquiryApiUrl?: string;
  inquiryApiKey?: string;
}

export class ClientConfigService {
  static async getByClientId(clientId: string): Promise<ClientConfigResponse> {
    const config = await ClientConfigModel.findOne({ clientId });
    if (!config) {
      return this.createDefault(clientId);
    }
    return this.formatConfig(config);
  }

  static async createDefault(clientId: string): Promise<ClientConfigResponse> {
    const config = await ClientConfigModel.create({
      clientId,
      greetingMessage: 'Hello! How can I help you today?',
      widgetPosition: 'bottom-right',
      widgetStyle: 'bubble',
      theme: 'light',
      quickActions: ['FAQ', 'Contact'],
      fallbackMessage: 'Let me connect you with our team.',
      allowedLanguages: ['en'],
    });

    return this.formatConfig(config);
  }

  static async update(clientId: string, data: UpdateClientConfigRequest): Promise<ClientConfigResponse> {
    let config = await ClientConfigModel.findOne({ clientId });
    
    if (!config) {
      config = await ClientConfigModel.create({
        clientId,
        ...data,
      });
    } else {
      config = await ClientConfigModel.findByIdAndUpdate(
        config._id,
        omitUndefined(data),
        { new: true }
      );
    }

    return this.formatConfig(config!);
  }

  static async delete(clientId: string): Promise<void> {
    const config = await ClientConfigModel.findOneAndDelete({ clientId });
    if (!config) {
      throw new ApiError(404, 'Client config not found');
    }
  }

  private static formatConfig(config: ClientConfigDocument): ClientConfigResponse {
    return {
      id: config._id.toString(),
      clientId: config.clientId.toString(),
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
      inquiryApiUrl: config.inquiryApiUrl,
      inquiryApiKey: config.inquiryApiKey,
    };
  }
}
