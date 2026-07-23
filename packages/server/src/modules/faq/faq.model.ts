import mongoose, { Document, Schema } from 'mongoose';

export interface FAQDocument extends Document {
  clientId: mongoose.Types.ObjectId;
  category: string;
  question: string;
  answer: string;
  answerHi?: string;
  keywords: string[];
  priority: number;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const faqSchema = new Schema<FAQDocument>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
    },
    answerHi: {
      type: String,
      trim: true,
    },
    keywords: {
      type: [String],
      default: [],
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
  },
  {
    timestamps: true,
  }
);

faqSchema.index({ clientId: 1, isActive: 1, isDeleted: 1 });
faqSchema.index({ clientId: 1, category: 1 });
faqSchema.index({ clientId: 1, keywords: 1 });
faqSchema.index(
  { question: 'text', answer: 'text', keywords: 'text' },
  { weights: { question: 10, keywords: 8, answer: 3 } }
);

export const FAQModel = mongoose.model<FAQDocument>('FAQ', faqSchema);
