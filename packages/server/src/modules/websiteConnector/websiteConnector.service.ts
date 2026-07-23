import { WebsiteConnectorModel, WebsiteConnectorDocument } from './websiteConnector.model.js';
import { ApiError } from '../../utils/apiError.js';
import { omitUndefined } from '../../utils/helpers.js';

export interface WebsiteConnectorResponse {
  id: string;
  clientId: string;
  websiteName: string;
  websiteType: string;
  knowledgeSource: string;
  inquiryApiEndpoint?: string;
  enabledModules: string[];
  theme: {
    primaryColor: string;
    secondaryColor: string;
    widgetStyle: string;
    borderRadius: string;
    fontFamily: string;
  };
  language: string;
  isActive: boolean;
}

export class WebsiteConnectorService {
  static async create(data: { clientId: string; websiteName: string; websiteType: string; knowledgeSource?: string; inquiryApiEndpoint?: string; enabledModules?: string[]; language?: string }): Promise<WebsiteConnectorResponse> {
    const existingConnector = await WebsiteConnectorModel.findOne({ clientId: data.clientId });
    if (existingConnector) {
      throw new ApiError(400, 'Website connector already exists for this client');
    }

    const connector = await WebsiteConnectorModel.create({
      clientId: data.clientId,
      websiteName: data.websiteName,
      websiteType: data.websiteType,
      knowledgeSource: data.knowledgeSource || 'manual',
      inquiryApiEndpoint: data.inquiryApiEndpoint,
      enabledModules: data.enabledModules || ['FAQ', 'Knowledge', 'Inquiry'],
      language: data.language || 'en',
    });

    return this.formatConnector(connector);
  }

  static async getByClientId(clientId: string): Promise<WebsiteConnectorResponse> {
    const connector = await WebsiteConnectorModel.findOne({ clientId });
    if (!connector) {
      throw new ApiError(404, 'Website connector not found');
    }
    return this.formatConnector(connector);
  }

  static async list(): Promise<WebsiteConnectorResponse[]> {
    const connectors = await WebsiteConnectorModel.find().sort({ createdAt: -1 });
    return connectors.map(this.formatConnector);
  }

  static async update(clientId: string, data: { websiteName?: string; websiteType?: string; knowledgeSource?: string; inquiryApiEndpoint?: string; enabledModules?: string[]; language?: string; isActive?: boolean }): Promise<WebsiteConnectorResponse> {
    const connector = await WebsiteConnectorModel.findOneAndUpdate(
      { clientId },
      omitUndefined(data),
      { new: true }
    );
    if (!connector) {
      throw new ApiError(404, 'Website connector not found');
    }
    return this.formatConnector(connector);
  }

  static async delete(clientId: string): Promise<void> {
    const connector = await WebsiteConnectorModel.findOneAndDelete({ clientId });
    if (!connector) {
      throw new ApiError(404, 'Website connector not found');
    }
  }

  private static formatConnector(connector: WebsiteConnectorDocument): WebsiteConnectorResponse {
    return {
      id: connector._id.toString(),
      clientId: connector.clientId.toString(),
      websiteName: connector.websiteName,
      websiteType: connector.websiteType,
      knowledgeSource: connector.knowledgeSource,
      inquiryApiEndpoint: connector.inquiryApiEndpoint,
      enabledModules: connector.enabledModules,
      theme: connector.theme,
      language: connector.language,
      isActive: connector.isActive,
    };
  }
}
