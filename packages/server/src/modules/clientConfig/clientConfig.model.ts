import mongoose, { Document, Schema } from 'mongoose';

export interface ClientConfigDocument extends Document {
  clientId: mongoose.Types.ObjectId;
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
    logo: {
      type: String,
    },
    brandColor: {
      type: String,
      default: '#3B82F6',
    },
    secondaryColor: {
      type: String,
      default: '#1E40AF',
    },
    botName: {
      type: String,
      default: 'Assistant',
    },
    greetingMessage: {
      type: String,
      default: 'Hello! How can I help you today?',
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light',
    },
    position: {
      type: String,
      enum: ['bottom-right', 'bottom-left'],
      default: 'bottom-right',
    },
    defaultLanguage: {
      type: String,
      enum: ['en', 'hi'],
      default: 'en',
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
    isActive: {
      type: Boolean,
      default: true,
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
