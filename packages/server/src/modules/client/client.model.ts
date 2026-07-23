import mongoose, { Document, Schema } from 'mongoose';

export type WebsiteType = 
  | 'corporate' 
  | 'restaurant' 
  | 'hotel' 
  | 'school' 
  | 'hospital' 
  | 'real_estate' 
  | 'portfolio' 
  | 'agency' 
  | 'landing_page' 
  | 'ecommerce';

export type ClientStatus = 'active' | 'inactive' | 'suspended';

export interface WidgetSettings {
  position: 'bottom-right' | 'bottom-left';
  width: string;
  height: string;
  borderRadius: string;
  offset: { x: string; y: string };
  animation: 'none' | 'slide' | 'fade';
  autoOpen: boolean;
  autoOpenDelay: number;
  showNotificationBadge: boolean;
  allowLocalhost: boolean;
}

export interface ClientDocument extends Document {
  clientId: string;
  name: string;
  email: string;
  companyName: string;
  phone?: string;
  website?: string;
  websiteType: WebsiteType;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  botName: string;
  defaultLanguage: 'en' | 'hi';
  timezone: string;
  status: ClientStatus;
  isActive: boolean;
  allowedDomains: string[];
  widgetSettings: WidgetSettings;
  widgetSecretKey: string;
  widgetVersion: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const widgetSettingsSchema = new Schema<WidgetSettings>({
  position: { type: String, enum: ['bottom-right', 'bottom-left'], default: 'bottom-right' },
  width: { type: String, default: '380px' },
  height: { type: String, default: '520px' },
  borderRadius: { type: String, default: '16px' },
  offset: {
    x: { type: String, default: '20px' },
    y: { type: String, default: '20px' },
  },
  animation: { type: String, enum: ['none', 'slide', 'fade'], default: 'slide' },
  autoOpen: { type: Boolean, default: false },
  autoOpenDelay: { type: Number, default: 3000 },
  showNotificationBadge: { type: Boolean, default: true },
  allowLocalhost: { type: Boolean, default: true },
}, { _id: false });

const clientSchema = new Schema<ClientDocument>(
  {
    clientId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    websiteType: {
      type: String,
      enum: ['corporate', 'restaurant', 'hotel', 'school', 'hospital', 'real_estate', 'portfolio', 'agency', 'landing_page', 'ecommerce'],
      default: 'corporate',
    },
    logo: {
      type: String,
    },
    primaryColor: {
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
    defaultLanguage: {
      type: String,
      enum: ['en', 'hi'],
      default: 'en',
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    allowedDomains: {
      type: [String],
      default: [],
    },
    widgetSettings: {
      type: widgetSettingsSchema,
      default: () => ({}),
    },
    widgetSecretKey: {
      type: String,
      default: () => require('crypto').randomBytes(32).toString('hex'),
    },
    widgetVersion: {
      type: String,
      default: '1.0.0',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

clientSchema.index({ clientId: 1 });
clientSchema.index({ email: 1 });
clientSchema.index({ createdBy: 1 });
clientSchema.index({ status: 1 });

export const ClientModel = mongoose.model<ClientDocument>('Client', clientSchema);
