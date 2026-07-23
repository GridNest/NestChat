import mongoose, { Document, Schema } from 'mongoose';

export interface SettingsDocument extends Document {
  companyName: string;
  supportEmail: string;
  supportPhone: string;
  timezone: string;
  businessHours: string;
  widgetDefaults: {
    primaryColor: string;
    secondaryColor: string;
    greetingMessage: string;
    botName: string;
    position: string;
    theme: string;
  };
  allowedLanguages: string[];
  defaultLanguage: string;
  updatedAt: Date;
}

const settingsSchema = new Schema<SettingsDocument>(
  {
    companyName: {
      type: String,
      default: 'NestChat',
    },
    supportEmail: {
      type: String,
      default: 'support@nestchat.com',
    },
    supportPhone: {
      type: String,
      default: '',
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
    businessHours: {
      type: String,
      default: '9:00 AM - 6:00 PM',
    },
    widgetDefaults: {
      primaryColor: { type: String, default: '#3B82F6' },
      secondaryColor: { type: String, default: '#1E40AF' },
      greetingMessage: { type: String, default: 'Hello! How can I help you today?' },
      botName: { type: String, default: 'Assistant' },
      position: { type: String, default: 'bottom-right' },
      theme: { type: String, default: 'light' },
    },
    allowedLanguages: {
      type: [String],
      default: ['en', 'hi'],
    },
    defaultLanguage: {
      type: String,
      default: 'en',
    },
  },
  {
    timestamps: true,
  }
);

export const SettingsModel = mongoose.model<SettingsDocument>('Settings', settingsSchema);
