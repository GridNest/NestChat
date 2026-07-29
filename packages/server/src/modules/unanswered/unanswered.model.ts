import mongoose, { Document, Schema } from 'mongoose';

export interface UnansweredQuestionDocument extends Document {
  clientId: mongoose.Types.ObjectId;
  question: string;
  conversationId?: mongoose.Types.ObjectId;  // Chat ID for trace-back
  sessionId: string;
  visitorId: string;
  count: number;
  firstAsked: Date;
  lastAsked: Date;
  confidenceScore?: number;  // AI confidence at time of failure (0.0–1.0)
  reason?: 'knowledge_not_found' | 'low_similarity' | 'empty_knowledge_base' | 'model_uncertain' | 'low_confidence';
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
    // AI confidence score at the time question was unanswered
    confidenceScore: {
      type: Number,
      min: 0,
      max: 1,
    },
    // Reason why the question was unanswered
    reason: {
      type: String,
      enum: ['knowledge_not_found', 'low_similarity', 'empty_knowledge_base', 'model_uncertain', 'low_confidence'],
    },
    // Link back to the conversation for admin review
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
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
