import mongoose, { Document, Schema } from 'mongoose';

export interface IChatAnalytics extends Document {
  conversationId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  visitorId: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  messageCount: number;
  userMessageCount: number;
  botMessageCount: number;
  status: 'active' | 'completed' | 'abandoned';
  completedInquiry: boolean;
  abandonedInquiry: boolean;
  fallbackCount: number;
  language: string;
  device: string;
  browser: string;
  os: string;
  referrer?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const chatAnalyticsSchema = new Schema<IChatAnalytics>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    visitorId: { type: String, required: true, index: true },
    startTime: { type: Date, required: true },
    endTime: Date,
    duration: { type: Number, default: 0 },
    messageCount: { type: Number, default: 0 },
    userMessageCount: { type: Number, default: 0 },
    botMessageCount: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'completed', 'abandoned'], default: 'active', index: true },
    completedInquiry: { type: Boolean, default: false },
    abandonedInquiry: { type: Boolean, default: false },
    fallbackCount: { type: Number, default: 0 },
    language: { type: String, default: 'en' },
    device: String,
    browser: String,
    os: String,
    referrer: String,
    tags: [String],
  },
  {
    timestamps: true,
  }
);

chatAnalyticsSchema.index({ clientId: 1, startTime: -1 });
chatAnalyticsSchema.index({ clientId: 1, status: 1 });

export const ChatAnalytics = mongoose.model<IChatAnalytics>('ChatAnalytics', chatAnalyticsSchema);
