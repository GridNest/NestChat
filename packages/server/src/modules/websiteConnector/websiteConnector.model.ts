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

export type ModuleName = 
  | 'FAQ' 
  | 'Knowledge' 
  | 'Inquiry' 
  | 'Gallery' 
  | 'Menu' 
  | 'Rooms' 
  | 'Products' 
  | 'Services' 
  | 'Portfolio' 
  | 'Blog' 
  | 'Events' 
  | 'Booking' 
  | 'Contact';

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  widgetStyle: 'bubble' | 'tab' | 'inline';
  borderRadius: string;
  fontFamily: string;
}

export interface WebsiteConnectorDocument extends Document {
  clientId: mongoose.Types.ObjectId;
  websiteName: string;
  websiteType: WebsiteType;
  knowledgeSource: 'manual' | 'url' | 'file';
  inquiryApiEndpoint?: string;
  enabledModules: ModuleName[];
  theme: ThemeConfig;
  language: 'en' | 'hi';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const websiteConnectorSchema = new Schema<WebsiteConnectorDocument>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      unique: true,
    },
    websiteName: {
      type: String,
      required: true,
      trim: true,
    },
    websiteType: {
      type: String,
      enum: ['corporate', 'restaurant', 'hotel', 'school', 'hospital', 'real_estate', 'portfolio', 'agency', 'landing_page', 'ecommerce'],
      required: true,
    },
    knowledgeSource: {
      type: String,
      enum: ['manual', 'url', 'file'],
      default: 'manual',
    },
    inquiryApiEndpoint: {
      type: String,
    },
    enabledModules: {
      type: [String],
      enum: ['FAQ', 'Knowledge', 'Inquiry', 'Gallery', 'Menu', 'Rooms', 'Products', 'Services', 'Portfolio', 'Blog', 'Events', 'Booking', 'Contact'],
      default: ['FAQ', 'Knowledge', 'Inquiry'],
    },
    theme: {
      primaryColor: { type: String, default: '#3B82F6' },
      secondaryColor: { type: String, default: '#1E40AF' },
      widgetStyle: { type: String, enum: ['bubble', 'tab', 'inline'], default: 'bubble' },
      borderRadius: { type: String, default: '12px' },
      fontFamily: { type: String, default: 'Inter, sans-serif' },
    },
    language: {
      type: String,
      enum: ['en', 'hi'],
      default: 'en',
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

websiteConnectorSchema.index({ clientId: 1 });

export const WebsiteConnectorModel = mongoose.model<WebsiteConnectorDocument>(
  'WebsiteConnector',
  websiteConnectorSchema
);
