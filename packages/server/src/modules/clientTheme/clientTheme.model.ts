import mongoose, { Document, Schema } from 'mongoose';

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface ClientThemeDocument extends Document {
  clientId: mongoose.Types.ObjectId;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  widgetStyle: 'bubble' | 'tab' | 'inline';
  borderRadius: string;
  fontFamily: string;
  fontSize: string;
  botAvatar?: string;
  companyLogo?: string;
  darkMode: ThemeMode;
  createdAt: Date;
  updatedAt: Date;
}

const clientThemeSchema = new Schema<ClientThemeDocument>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      unique: true,
    },
    primaryColor: {
      type: String,
      default: '#3B82F6',
    },
    secondaryColor: {
      type: String,
      default: '#1E40AF',
    },
    backgroundColor: {
      type: String,
      default: '#FFFFFF',
    },
    textColor: {
      type: String,
      default: '#1F2937',
    },
    borderColor: {
      type: String,
      default: '#E5E7EB',
    },
    widgetStyle: {
      type: String,
      enum: ['bubble', 'tab', 'inline'],
      default: 'bubble',
    },
    borderRadius: {
      type: String,
      default: '12px',
    },
    fontFamily: {
      type: String,
      default: 'Inter, sans-serif',
    },
    fontSize: {
      type: String,
      default: '14px',
    },
    botAvatar: {
      type: String,
    },
    companyLogo: {
      type: String,
    },
    darkMode: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light',
    },
  },
  {
    timestamps: true,
  }
);

clientThemeSchema.index({ clientId: 1 });

export const ClientThemeModel = mongoose.model<ClientThemeDocument>(
  'ClientTheme',
  clientThemeSchema
);
