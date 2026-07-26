import mongoose, { Document, Schema } from 'mongoose';

export interface ChatMessageDocument extends Document {
  chatId: mongoose.Types.ObjectId;
  sender: 'user' | 'bot' | 'agent';
  content: string;
  messageType: 'text' | 'quickAction' | 'inquiry' | 'system' | 'agent';
  metadata?: {
    matchedType?: 'faq' | 'knowledge' | 'quickAction' | 'unknown';
    matchedId?: string;
    confidence?: number;
    responseTimeMs?: number;
  };
  timestamp: Date;
  createdAt: Date;
}

const chatMessageSchema = new Schema<ChatMessageDocument>(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
      index: true,
    },
    sender: {
      type: String,
      enum: ['user', 'bot', 'agent'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    messageType: {
      type: String,
      enum: ['text', 'quickAction', 'inquiry', 'system', 'agent'],
      default: 'text',
    },
    metadata: {
      matchedType: {
        type: String,
        enum: ['faq', 'knowledge', 'quickAction', 'unknown'],
      },
      matchedId: String,
      confidence: Number,
      responseTimeMs: Number,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

chatMessageSchema.index({ chatId: 1, timestamp: 1 });

export const ChatMessageModel = mongoose.model<ChatMessageDocument>(
  'ChatMessage',
  chatMessageSchema
);
