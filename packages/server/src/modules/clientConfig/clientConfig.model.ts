import mongoose, { Document, Schema } from 'mongoose';

export type WidgetPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
export type WidgetStyle = 'bubble' | 'tab' | 'inline';
export type ThemeMode = 'light' | 'dark' | 'auto';

export interface ClientConfigDocument extends Document {
  clientId: mongoose.Types.ObjectId;
  greetingMessage: string;
  widgetPosition: WidgetPosition;
  widgetStyle: WidgetStyle;
  theme: ThemeMode;
  quickActions: string[];
  businessHours?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  fallbackMessage: string;
  allowedLanguages: ('en' | 'hi')[];
  inquiryApiUrl?: string;
  inquiryApiKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const clientConfigSchema = new Schema<ClientConfigDocument>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      unique: true,
    },
    greetingMessage: {
      type: String,
      default: 'Hello! How can I help you today?',
    },
    widgetPosition: {
      type: String,
      enum: ['bottom-right', 'bottom-left', 'top-right', 'top-left'],
      default: 'bottom-right',
    },
    widgetStyle: {
      type: String,
      enum: ['bubble', 'tab', 'inline'],
      default: 'bubble',
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light',
    },
    quickActions: {
      type: [String],
      default: ['FAQ', 'Contact'],
    },
    businessHours: {
      type: String,
    },
    contactEmail: {
      type: String,
    },
    contactPhone: {
      type: String,
    },
    contactAddress: {
      type: String,
    },
    fallbackMessage: {
      type: String,
      default: 'Let me connect you with our team.',
    },
    allowedLanguages: {
      type: [String],
      enum: ['en', 'hi'],
      default: ['en'],
    },
    inquiryApiUrl: {
      type: String,
    },
    inquiryApiKey: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

clientConfigSchema.index({ clientId: 1 });

export const ClientConfigModel = mongoose.model<ClientConfigDocument>(
  'ClientConfig',
  clientConfigSchema
);
