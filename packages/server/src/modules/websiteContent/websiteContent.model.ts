import mongoose, { Document, Schema } from 'mongoose';

export interface CrawlMetadata {
  lastCrawlAt: Date | null;
  crawlStatus: 'never' | 'in_progress' | 'success' | 'failed';
  pagesFound: number;
  pagesScraped: number;
  itemsExtracted: number;
  failedUrls: string[];
  crawlLogs: string[];
}

export interface WebsiteContentDocument extends Document {
  clientId: mongoose.Types.ObjectId;
  url: string;
  title: string;
  content: string;
  contentType: 'heading' | 'paragraph' | 'menu_item' | 'pricing' | 'contact' | 'service' | 'gallery' | 'hours' | 'policy' | 'other';
  category: string;
  section: string;
  pagePath: string;
  language: 'en' | 'hi' | 'both';
  priority: number;
  isActive: boolean;
  isDeleted: boolean;
  lastSyncedAt: Date;
  crawlMetadata: CrawlMetadata;
  createdAt: Date;
  updatedAt: Date;
}

const websiteContentSchema = new Schema<WebsiteContentDocument>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    contentType: {
      type: String,
      enum: ['heading', 'paragraph', 'menu_item', 'pricing', 'contact', 'service', 'gallery', 'hours', 'policy', 'other'],
      default: 'paragraph',
    },
    category: {
      type: String,
      default: 'general',
      trim: true,
      lowercase: true,
    },
    section: {
      type: String,
      default: '',
      trim: true,
    },
    pagePath: {
      type: String,
      default: '/',
      trim: true,
    },
    language: {
      type: String,
      default: 'en',
    },
    priority: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    lastSyncedAt: {
      type: Date,
      default: Date.now,
    },
    crawlMetadata: {
      type: new Schema({
        lastCrawlAt: { type: Date, default: null },
        crawlStatus: { type: String, enum: ['never', 'in_progress', 'success', 'failed'], default: 'never' },
        pagesFound: { type: Number, default: 0 },
        pagesScraped: { type: Number, default: 0 },
        itemsExtracted: { type: Number, default: 0 },
        failedUrls: { type: [String], default: [] },
        crawlLogs: { type: [String], default: [] },
      }, { _id: false }),
      default: () => ({
        lastCrawlAt: null,
        crawlStatus: 'never',
        pagesFound: 0,
        pagesScraped: 0,
        itemsExtracted: 0,
        failedUrls: [],
        crawlLogs: [],
      }),
    },
  },
  {
    timestamps: true,
  }
);

websiteContentSchema.index({ clientId: 1, contentType: 1 });
websiteContentSchema.index({ clientId: 1, category: 1 });
websiteContentSchema.index({ clientId: 1, isActive: 1, isDeleted: 1 });
websiteContentSchema.index(
  { title: 'text', content: 'text', section: 'text' },
  { weights: { title: 10, section: 5, content: 3 } }
);

export const WebsiteContentModel = mongoose.model<WebsiteContentDocument>(
  'WebsiteContent',
  websiteContentSchema
);
