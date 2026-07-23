import mongoose, { Document, Schema } from 'mongoose';

export interface UnansweredQuestionDocument extends Document {
  clientId: mongoose.Types.ObjectId;
  question: string;
  sessionId: string;
  visitorId: string;
  count: number;
  firstAsked: Date;
  lastAsked: Date;
  convertedToFaq: boolean;
  faqId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const unansweredSchema = new Schema<UnansweredQuestionDocument>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    sessionId: {
      type: String,
      required: true,
    },
    visitorId: {
      type: String,
      required: true,
    },
    count: {
      type: Number,
      default: 1,
    },
    firstAsked: {
      type: Date,
      default: Date.now,
    },
    lastAsked: {
      type: Date,
      default: Date.now,
    },
    convertedToFaq: {
      type: Boolean,
      default: false,
    },
    faqId: {
      type: Schema.Types.ObjectId,
      ref: 'FAQ',
    },
  },
  {
    timestamps: true,
  }
);

unansweredSchema.index({ clientId: 1, question: 1 });
unansweredSchema.index({ clientId: 1, convertedToFaq: 1 });
unansweredSchema.index({ clientId: 1, count: -1 });

export const UnansweredModel = mongoose.model<UnansweredQuestionDocument>(
  'UnansweredQuestion',
  unansweredSchema
);
