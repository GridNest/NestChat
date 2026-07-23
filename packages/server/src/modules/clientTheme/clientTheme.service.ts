import { UpdateClientThemeRequest } from '@nestchat/shared';
import { ClientThemeModel, ClientThemeDocument } from './clientTheme.model.js';
import { ApiError } from '../../utils/apiError.js';
import { omitUndefined } from '../../utils/helpers.js';

export interface ClientThemeResponse {
  id: string;
  clientId: string;
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
}

export class ClientThemeService {
  static async getByClientId(clientId: string): Promise<ClientThemeResponse> {
    const theme = await ClientThemeModel.findOne({ clientId });
    if (!theme) {
      return this.createDefault(clientId);
    }
    return this.formatTheme(theme);
  }

  static async createDefault(clientId: string): Promise<ClientThemeResponse> {
    const theme = await ClientThemeModel.create({
      clientId,
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      backgroundColor: '#FFFFFF',
      textColor: '#1F2937',
      borderColor: '#E5E7EB',
      widgetStyle: 'bubble',
      borderRadius: '12px',
      fontFamily: 'Inter, sans-serif',
      fontSize: '14px',
      darkMode: 'light',
    });

    return this.formatTheme(theme);
  }

  static async update(clientId: string, data: UpdateClientThemeRequest): Promise<ClientThemeResponse> {
    let theme = await ClientThemeModel.findOne({ clientId });
    
    if (!theme) {
      theme = await ClientThemeModel.create({
        clientId,
        ...data,
      });
    } else {
      theme = await ClientThemeModel.findByIdAndUpdate(
        theme._id,
        omitUndefined(data),
        { new: true }
      );
    }

    return this.formatTheme(theme!);
  }

  static async delete(clientId: string): Promise<void> {
    const theme = await ClientThemeModel.findOneAndDelete({ clientId });
    if (!theme) {
      throw new ApiError(404, 'Client theme not found');
    }
  }

  private static formatTheme(theme: ClientThemeDocument): ClientThemeResponse {
    return {
      id: theme._id.toString(),
      clientId: theme.clientId.toString(),
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
    };
  }
}
