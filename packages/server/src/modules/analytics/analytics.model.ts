import mongoose, { Document, Schema } from 'mongoose';

export interface IAnalytics extends Document {
  clientId: mongoose.Types.ObjectId;
  date: Date;
  period: 'daily' | 'weekly' | 'monthly';
  metrics: {
    visitors: number;
    uniqueVisitors: number;
    returningVisitors: number;
    chats: number;
    activeConversations: number;
    leads: number;
    completedInquiries: number;
    abandonedInquiries: number;
    fallbackCount: number;
    totalMessages: number;
    averageResponseTime: number;
    averageConversationDuration: number;
    // New: AI quality metrics
    answeredQuestions: number;
    unansweredQuestions: number;
    inquiriesGenerated: number;
    humanHandoverTriggered: number;
    averageConfidenceScore: number;
    confidenceScoreSum: number;   // Used to compute rolling average
    confidenceScoreCount: number; // Used to compute rolling average
  };
  languageDistribution: {
    [language: string]: number;
  };
  topQuestions: Array<{
    question: string;
    count: number;
  }>;
  // New: top unanswered questions for admin insights
  topUnansweredQuestions: Array<{
    question: string;
    count: number;
    reason?: string;
  }>;
  // New: topic/intent breakdown for admin insights
  insightTopics: Array<{
    topic: string;
    category: string;
    count: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const analyticsSchema = new Schema<IAnalytics>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    date: { type: Date, required: true, index: true },
    period: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
    metrics: {
      visitors: { type: Number, default: 0 },
      uniqueVisitors: { type: Number, default: 0 },
      returningVisitors: { type: Number, default: 0 },
      chats: { type: Number, default: 0 },
      activeConversations: { type: Number, default: 0 },
      leads: { type: Number, default: 0 },
      completedInquiries: { type: Number, default: 0 },
      abandonedInquiries: { type: Number, default: 0 },
      fallbackCount: { type: Number, default: 0 },
      totalMessages: { type: Number, default: 0 },
      averageResponseTime: { type: Number, default: 0 },
      averageConversationDuration: { type: Number, default: 0 },
      answeredQuestions: { type: Number, default: 0 },
      unansweredQuestions: { type: Number, default: 0 },
      inquiriesGenerated: { type: Number, default: 0 },
      humanHandoverTriggered: { type: Number, default: 0 },
      averageConfidenceScore: { type: Number, default: 0 },
      confidenceScoreSum: { type: Number, default: 0 },
      confidenceScoreCount: { type: Number, default: 0 },
    },
    languageDistribution: { type: Schema.Types.Mixed, default: {} },
    topQuestions: [{
      question: String,
      count: Number,
    }],
    topUnansweredQuestions: [{
      question: String,
      count: Number,
      reason: String,
    }],
    insightTopics: [{
      topic: String,
      category: String,
      count: Number,
    }],
  },
  {
    timestamps: true,
  }
);

analyticsSchema.index({ clientId: 1, date: -1, period: 1 });

export const Analytics = mongoose.model<IAnalytics>('Analytics', analyticsSchema);
