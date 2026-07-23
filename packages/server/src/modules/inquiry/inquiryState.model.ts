import mongoose, { Document, Schema } from 'mongoose';

export interface InquiryStateDocument extends Document {
  chatId: string;
  sessionId: string;
  clientId: string;
  visitorId: string;
  language: 'en' | 'hi';
  currentStep: string;
  completedFields: string[];
  skippedFields: string[];
  data: {
    name?: string;
    email?: string;
    phone?: string;
    country?: string;
    state?: string;
    service?: string;
    details?: string;
    company?: string;
  };
  status: 'active' | 'completed' | 'cancelled' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const inquiryStateSchema = new Schema<InquiryStateDocument>(
  {
    chatId: {
      type: String,
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
    },
    clientId: {
      type: String,
      required: true,
      index: true,
    },
    visitorId: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      enum: ['en', 'hi'],
      default: 'en',
    },
    currentStep: {
      type: String,
      default: 'name',
    },
    completedFields: {
      type: [String],
      default: [],
    },
    skippedFields: {
      type: [String],
      default: [],
    },
    data: {
      name: String,
      email: String,
      phone: String,
      country: String,
      state: String,
      service: String,
      details: String,
      company: String,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled', 'failed'],
      default: 'active',
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

inquiryStateSchema.index({ chatId: 1, status: 1 });
inquiryStateSchema.index({ sessionId: 1 });

export const InquiryStateModel = mongoose.model<InquiryStateDocument>(
  'InquiryState',
  inquiryStateSchema
);
