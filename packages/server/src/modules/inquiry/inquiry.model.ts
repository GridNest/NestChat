import mongoose, { Document, Schema } from 'mongoose';

export interface InquiryDocument extends Document {
  clientId: mongoose.Types.ObjectId;
  chatId?: mongoose.Types.ObjectId;
  sessionId?: string;
  visitorId?: string;
  name: string;
  email: string;
  phone: string;
  country?: string;
  state?: string;
  service: string;
  details: string;
  company?: string;
  source: 'chatbot' | 'website' | 'manual';
  status: 'new' | 'contacted' | 'converted' | 'closed';
  externalApiStatus: 'pending' | 'forwarded' | 'failed' | 'no_api';
  externalApiResponse?: string;
  language: 'en' | 'hi';
  submittedAt: Date;
  forwardedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const inquirySchema = new Schema<InquiryDocument>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    chatId: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
    },
    sessionId: {
      type: String,
      index: true,
    },
    visitorId: {
      type: String,
      index: true,
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
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    service: {
      type: String,
      required: true,
      trim: true,
    },
    details: {
      type: String,
      required: true,
    },
    company: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      enum: ['chatbot', 'website', 'manual'],
      default: 'chatbot',
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'converted', 'closed'],
      default: 'new',
    },
    externalApiStatus: {
      type: String,
      enum: ['pending', 'forwarded', 'failed', 'no_api'],
      default: 'pending',
    },
    externalApiResponse: {
      type: String,
    },
    language: {
      type: String,
      enum: ['en', 'hi'],
      default: 'en',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    forwardedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

inquirySchema.index({ clientId: 1, createdAt: -1 });
inquirySchema.index({ clientId: 1, status: 1 });
inquirySchema.index({ sessionId: 1 });

export const InquiryModel = mongoose.model<InquiryDocument>('Inquiry', inquirySchema);
