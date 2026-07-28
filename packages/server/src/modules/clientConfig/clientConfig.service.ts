import { UpdateClientConfigRequest } from '@nestchat/shared';
import { ClientConfigModel, ClientConfigDocument } from './clientConfig.model.js';
import { ClientModel } from '../client/client.model.js';
import { ApiError } from '../../utils/apiError.js';
import { omitUndefined } from '../../utils/helpers.js';

export interface ClientConfigResponse {
  id: string;
  clientId: string;
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
      humanHandoverMessage: 'Let me connect you with our team.',
      allowedLanguages: ['en'],
      collectVisitorName: false,
      collectEmail: false,
      collectPhone: false,
      enableChatHistory: true,
      enableFAQs: true,
      enableKnowledgeBase: true,
      enableInquiryForm: true,
      enableLiveAgent: true,
      enableAnalytics: true,
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

  static async getPreviewData(clientId: string): Promise<Record<string, any>> {
    const client = await ClientModel.findById(clientId);
    const config = await ClientConfigModel.findOne({ clientId });

    if (!client) {
      throw ApiError.notFound('Client not found');
    }

    return {
      client: {
        name: client.name,
        companyName: client.companyName,
        logo: client.logo,
        botName: client.botName,
        primaryColor: client.primaryColor,
        secondaryColor: client.secondaryColor,
      },
      config: config ? this.formatConfig(config) : null,
    };
  }

  private static formatConfig(config: ClientConfigDocument): ClientConfigResponse {
    return {
      id: config._id.toString(),
      clientId: config.clientId.toString(),
      avatarUrl: config.avatarUrl,
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
      humanHandoverMessage: config.humanHandoverMessage,
      allowedLanguages: config.allowedLanguages,
      inquiryApiUrl: config.inquiryApiUrl,
      inquiryApiKey: config.inquiryApiKey,
      whatsapp: config.whatsapp,
      collectVisitorName: config.collectVisitorName,
      collectEmail: config.collectEmail,
      collectPhone: config.collectPhone,
      enableChatHistory: config.enableChatHistory,
      enableFAQs: config.enableFAQs,
      enableKnowledgeBase: config.enableKnowledgeBase,
      enableInquiryForm: config.enableInquiryForm,
      enableLiveAgent: config.enableLiveAgent,
      enableAnalytics: config.enableAnalytics,
      enableWebsiteSync: config.enableWebsiteSync,
    };
  }
}
