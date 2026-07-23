import mongoose, { Document, Schema } from 'mongoose';

export interface ChatDocument extends Document {
  clientId: mongoose.Types.ObjectId;
  sessionId: string;
  visitorId: string;
  visitorInfo?: {
    userAgent?: string;
    referrer?: string;
    url?: string;
    ip?: string;
  };
  language: 'en' | 'hi';
  status: 'active' | 'ended';
  startedAt: Date;
  endedAt?: Date;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const chatSchema = new Schema<ChatDocument>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    visitorId: {
      type: String,
      required: true,
      index: true,
    },
    visitorInfo: {
      userAgent: String,
      referrer: String,
      url: String,
      ip: String,
    },
    language: {
      type: String,
      enum: ['en', 'hi'],
      default: 'en',
    },
    status: {
      type: String,
      enum: ['active', 'ended'],
      default: 'active',
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
    },
    messageCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

chatSchema.index({ sessionId: 1 }, { unique: true });
chatSchema.index({ clientId: 1, status: 1 });
chatSchema.index({ visitorId: 1 });
chatSchema.index({ createdAt: -1 });

export const ChatModel = mongoose.model<ChatDocument>('Chat', chatSchema);
