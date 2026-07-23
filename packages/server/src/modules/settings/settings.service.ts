import { SettingsModel } from './settings.model.js';

export class SettingsService {
  static async get() {
    let settings = await SettingsModel.findOne();
    if (!settings) {
      settings = await SettingsModel.create({});
    }
    return settings;
  }

  static async update(data: {
    companyName?: string;
    supportEmail?: string;
    supportPhone?: string;
    timezone?: string;
    businessHours?: string;
    widgetDefaults?: {
      primaryColor?: string;
      secondaryColor?: string;
      greetingMessage?: string;
      botName?: string;
      position?: string;
      theme?: string;
    };
    allowedLanguages?: string[];
    defaultLanguage?: string;
  }) {
    let settings = await SettingsModel.findOne();
    if (!settings) {
      settings = await SettingsModel.create(data);
    } else {
      Object.assign(settings, data);
      await settings.save();
    }
    return settings;
  }
}
