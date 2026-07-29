import { Analytics, IAnalytics } from './analytics.model.js';
import { ChatAnalytics, IChatAnalytics } from './chatAnalytics.model.js';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TrackMessageData {
  clientId: string;
  responseTimeMs: number;
  confidence: number;
  isAnswered: boolean;
  isFallback: boolean;
  inquiryCreated: boolean;
  language: string;
  question: string;
  topic: string;
  category: string;
}

// ─── Analytics Service ────────────────────────────────────────────────────────

export class AnalyticsService {
  // ─── Existing methods (unchanged) ──────────────────────────────────────────

  async trackVisitor(clientId: string, visitorId: string, metadata?: any): Promise<void> {
    const today = this.getDateOnly(new Date());
    
    await Analytics.findOneAndUpdate(
      { clientId, date: today, period: 'daily' },
      {
        $inc: { 'metrics.visitors': 1 },
        $setOnInsert: { period: 'daily' },
      },
      { upsert: true }
    );

    await this.updateWeeklyMonthly(clientId, today, 'visitors');
  }

  async trackChat(clientId: string, conversationId: string, visitorId: string): Promise<void> {
    const today = this.getDateOnly(new Date());
    
    await Analytics.findOneAndUpdate(
      { clientId, date: today, period: 'daily' },
      {
        $inc: { 'metrics.chats': 1 },
        $setOnInsert: { period: 'daily' },
      },
      { upsert: true }
    );

    await this.updateWeeklyMonthly(clientId, today, 'chats');
  }

  async trackConversationEnd(
    clientId: string,
    conversationId: string,
    duration: number,
    messageCount: number,
    status: 'completed' | 'abandoned'
  ): Promise<void> {
    const today = this.getDateOnly(new Date());
    const updateFields: any = {};

    if (status === 'completed') {
      updateFields['metrics.completedInquiries'] = 1;
    } else {
      updateFields['metrics.abandonedInquiries'] = 1;
    }

    updateFields['metrics.totalMessages'] = messageCount;
    updateFields['metrics.averageConversationDuration'] = duration;

    await Analytics.findOneAndUpdate(
      { clientId, date: today, period: 'daily' },
      { $inc: updateFields },
      { upsert: true }
    );

    await ChatAnalytics.findOneAndUpdate(
      { conversationId },
      {
        endTime: new Date(),
        duration,
        messageCount,
        status,
        completedInquiry: status === 'completed',
        abandonedInquiry: status === 'abandoned',
      }
    );
  }

  async trackLead(clientId: string): Promise<void> {
    const today = this.getDateOnly(new Date());
    
    await Analytics.findOneAndUpdate(
      { clientId, date: today, period: 'daily' },
      {
        $inc: { 'metrics.leads': 1 },
        $setOnInsert: { period: 'daily' },
      },
      { upsert: true }
    );

    await this.updateWeeklyMonthly(clientId, today, 'leads');
  }

  async trackFallback(clientId: string): Promise<void> {
    const today = this.getDateOnly(new Date());
    
    await Analytics.findOneAndUpdate(
      { clientId, date: today, period: 'daily' },
      {
        $inc: { 'metrics.fallbackCount': 1 },
        $setOnInsert: { period: 'daily' },
      },
      { upsert: true }
    );

    await this.updateWeeklyMonthly(clientId, today, 'fallbackCount');
  }

  async trackLanguage(clientId: string, language: string): Promise<void> {
    const today = this.getDateOnly(new Date());
    
    await Analytics.findOneAndUpdate(
      { clientId, date: today, period: 'daily' },
      {
        $inc: { [`languageDistribution.${language}`]: 1 },
        $setOnInsert: { period: 'daily' },
      },
      { upsert: true }
    );
  }

  async trackQuestion(clientId: string, question: string): Promise<void> {
    const today = this.getDateOnly(new Date());
    
    const analytics = await Analytics.findOne({ clientId, date: today, period: 'daily' });
    
    if (analytics) {
      const existingQuestion = analytics.topQuestions.find(
        q => q.question.toLowerCase() === question.toLowerCase()
      );
      
      if (existingQuestion) {
        existingQuestion.count++;
      } else {
        analytics.topQuestions.push({ question, count: 1 });
      }
      
      analytics.topQuestions.sort((a, b) => b.count - a.count);
      analytics.topQuestions = analytics.topQuestions.slice(0, 100);
      
      await analytics.save();
    }
  }

  async createChatAnalytics(data: Partial<IChatAnalytics>): Promise<IChatAnalytics> {
    return ChatAnalytics.create(data);
  }

  // ─── NEW: Unified message tracking ─────────────────────────────────────────

  /**
   * Single atomic call that updates all relevant analytics counters per message.
   * Called by EventBus after every bot response.
   */
  async trackMessage(data: TrackMessageData): Promise<void> {
    const today = this.getDateOnly(new Date());

    const inc: Record<string, number> = {
      'metrics.totalMessages': 1,
    };

    if (data.isAnswered) {
      inc['metrics.answeredQuestions'] = 1;
    } else {
      inc['metrics.unansweredQuestions'] = 1;
    }

    if (data.isFallback) {
      inc['metrics.fallbackCount'] = 1;
      inc['metrics.humanHandoverTriggered'] = 1;
    }

    if (data.inquiryCreated) {
      inc['metrics.inquiriesGenerated'] = 1;
      inc['metrics.leads'] = 1;
    }

    if (data.responseTimeMs > 0) {
      // Running sum for average calculation
      inc['metrics.averageResponseTime'] = data.responseTimeMs;
    }

    if (data.confidence > 0) {
      inc['metrics.confidenceScoreSum'] = data.confidence;
      inc['metrics.confidenceScoreCount'] = 1;
    }

    if (data.language) {
      inc[`languageDistribution.${data.language}`] = 1;
    }

    // Atomic increment
    await Analytics.findOneAndUpdate(
      { clientId: data.clientId, date: today, period: 'daily' },
      { $inc: inc },
      { upsert: true }
    );

    // Update topic insights and top questions non-blocking
    await Promise.allSettled([
      this.updateTopQuestion(data.clientId, today, data.question),
      data.isFallback
        ? this.updateTopUnansweredQuestion(data.clientId, today, data.question)
        : Promise.resolve(),
      this.updateInsightTopic(data.clientId, today, data.topic, data.category),
      this.recomputeAverageConfidence(data.clientId, today),
      this.updateWeeklyMonthly(data.clientId, today, 'totalMessages'),
    ]);
  }

  // ─── NEW: Admin Insights ───────────────────────────────────────────────────

  /**
   * Returns admin intelligence insights: top requested topics, knowledge gaps,
   * most searched categories — computed from stored analytics data.
   */
  async getInsights(clientId: string, days: number = 30): Promise<{
    topRequestedTopics: Array<{ topic: string; category: string; count: number }>;
    knowledgeGaps: Array<{ question: string; count: number }>;
    topAnsweredCategories: Array<{ category: string; count: number }>;
    confidenceTrend: Array<{ date: string; avgConfidence: number }>;
    inquiryTriggerReasons: Array<{ reason: string; count: number }>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [topTopics, gapQuestions, confidenceTrend] = await Promise.all([
      // Top requested insight topics
      Analytics.aggregate([
        { $match: { clientId, date: { $gte: startDate }, period: 'daily' } },
        { $unwind: '$insightTopics' },
        {
          $group: {
            _id: { topic: '$insightTopics.topic', category: '$insightTopics.category' },
            count: { $sum: '$insightTopics.count' },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // Knowledge gaps (top unanswered)
      Analytics.aggregate([
        { $match: { clientId, date: { $gte: startDate }, period: 'daily' } },
        { $unwind: '$topUnansweredQuestions' },
        {
          $group: {
            _id: '$topUnansweredQuestions.question',
            count: { $sum: '$topUnansweredQuestions.count' },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 15 },
      ]),

      // Confidence trend over time
      Analytics.aggregate([
        { $match: { clientId, date: { $gte: startDate }, period: 'daily' } },
        {
          $project: {
            dateStr: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            avgConfidence: '$metrics.averageConfidenceScore',
          },
        },
        { $sort: { dateStr: 1 } },
      ]),
    ]);

    // Category breakdown from topic data
    const categoryMap = new Map<string, number>();
    for (const t of topTopics) {
      const cat = t._id.category as string;
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + t.count);
    }
    const topAnsweredCategories = Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return {
      topRequestedTopics: topTopics.map(t => ({
        topic: t._id.topic,
        category: t._id.category,
        count: t.count,
      })),
      knowledgeGaps: gapQuestions.map(q => ({
        question: q._id,
        count: q.count,
      })),
      topAnsweredCategories,
      confidenceTrend: confidenceTrend.map(c => ({
        date: c.dateStr,
        avgConfidence: Math.round((c.avgConfidence || 0) * 100) / 100,
      })),
      inquiryTriggerReasons: [],  // Computed from UnansweredModel if needed
    };
  }

  // ─── Enhanced Dashboard ────────────────────────────────────────────────────

  async getDashboardStats(clientId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [dailyStats, totals] = await Promise.all([
      Analytics.find({
        clientId,
        date: { $gte: startDate },
        period: 'daily',
      }).sort({ date: 1 }),
      Analytics.aggregate([
        {
          $match: {
            clientId: clientId,
            date: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: null,
            totalVisitors: { $sum: '$metrics.visitors' },
            totalChats: { $sum: '$metrics.chats' },
            totalLeads: { $sum: '$metrics.leads' },
            totalCompletedInquiries: { $sum: '$metrics.completedInquiries' },
            totalAbandonedInquiries: { $sum: '$metrics.abandonedInquiries' },
            totalMessages: { $sum: '$metrics.totalMessages' },
            avgResponseTime: { $avg: '$metrics.averageResponseTime' },
            avgConversationDuration: { $avg: '$metrics.averageConversationDuration' },
            // New fields
            totalAnswered: { $sum: '$metrics.answeredQuestions' },
            totalUnanswered: { $sum: '$metrics.unansweredQuestions' },
            totalInquiriesGenerated: { $sum: '$metrics.inquiriesGenerated' },
            totalHumanHandover: { $sum: '$metrics.humanHandoverTriggered' },
            totalFallbacks: { $sum: '$metrics.fallbackCount' },
            avgConfidenceScoreSum: { $sum: '$metrics.confidenceScoreSum' },
            avgConfidenceScoreCount: { $sum: '$metrics.confidenceScoreCount' },
          },
        },
      ]),
    ]);

    const languageDistribution = await Analytics.aggregate([
      {
        $match: {
          clientId,
          date: { $gte: startDate },
        },
      },
      {
        $project: {
          languageDistribution: { $objectToArray: '$languageDistribution' },
        },
      },
      {
        $unwind: '$languageDistribution',
      },
      {
        $group: {
          _id: '$languageDistribution.k',
          count: { $sum: '$languageDistribution.v' },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    const topQuestions = await Analytics.aggregate([
      {
        $match: {
          clientId,
          date: { $gte: startDate },
        },
      },
      {
        $unwind: '$topQuestions',
      },
      {
        $group: {
          _id: '$topQuestions.question',
          total: { $sum: '$topQuestions.count' },
        },
      },
      {
        $sort: { total: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    const raw = totals[0] || {
      totalVisitors: 0,
      totalChats: 0,
      totalLeads: 0,
      totalCompletedInquiries: 0,
      totalAbandonedInquiries: 0,
      totalMessages: 0,
      avgResponseTime: 0,
      avgConversationDuration: 0,
      totalAnswered: 0,
      totalUnanswered: 0,
      totalInquiriesGenerated: 0,
      totalHumanHandover: 0,
      totalFallbacks: 0,
      avgConfidenceScoreSum: 0,
      avgConfidenceScoreCount: 0,
    };

    // Compute proper average confidence score
    const avgConfidence = raw.avgConfidenceScoreCount > 0
      ? raw.avgConfidenceScoreSum / raw.avgConfidenceScoreCount
      : 0;

    const conversionRate = raw.totalVisitors > 0
      ? (raw.totalLeads / raw.totalVisitors) * 100
      : 0;

    const answerRate = (raw.totalAnswered + raw.totalUnanswered) > 0
      ? (raw.totalAnswered / (raw.totalAnswered + raw.totalUnanswered)) * 100
      : 0;

    return {
      summary: {
        ...raw,
        avgConfidence: Math.round(avgConfidence * 100) / 100,
        avgConfidencePercent: Math.round(avgConfidence * 100),
        conversionRate: Math.round(conversionRate * 10) / 10,
        answerRate: Math.round(answerRate * 10) / 10,
        activeConversations: await this.getActiveConversations(clientId),
      },
      dailyStats,
      languageDistribution: languageDistribution.map(l => ({
        language: l._id,
        count: l.count,
      })),
      topQuestions: topQuestions.map(q => ({
        question: q._id,
        count: q.total,
      })),
    };
  }

  async getChatAnalytics(clientId: string, filters: {
    startDate?: Date;
    endDate?: Date;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const query: any = { clientId };
    
    if (filters.startDate || filters.endDate) {
      query.startTime = {};
      if (filters.startDate) query.startTime.$gte = filters.startDate;
      if (filters.endDate) query.startTime.$lte = filters.endDate;
    }
    if (filters.status) query.status = filters.status;

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const [analytics, total] = await Promise.all([
      ChatAnalytics.find(query)
        .sort({ startTime: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ChatAnalytics.countDocuments(query),
    ]);

    const stats = await ChatAnalytics.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalConversations: { $sum: 1 },
          avgDuration: { $avg: '$duration' },
          avgMessages: { $avg: '$messageCount' },
          completedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          abandonedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'abandoned'] }, 1, 0] },
          },
          totalFallbacks: { $sum: '$fallbackCount' },
        },
      },
    ]);

    return {
      analytics,
      stats: stats[0] || {
        totalConversations: 0,
        avgDuration: 0,
        avgMessages: 0,
        completedCount: 0,
        abandonedCount: 0,
        totalFallbacks: 0,
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private async getActiveConversations(clientId: string): Promise<number> {
    return ChatAnalytics.countDocuments({
      clientId,
      status: 'active',
    });
  }

  private async updateWeeklyMonthly(clientId: string, date: Date, field: string) {
    const weekStart = this.getWeekStart(date);
    const monthStart = this.getMonthStart(date);

    await Analytics.findOneAndUpdate(
      { clientId, date: weekStart, period: 'weekly' },
      { $inc: { [`metrics.${field}`]: 1 } },
      { upsert: true }
    );

    await Analytics.findOneAndUpdate(
      { clientId, date: monthStart, period: 'monthly' },
      { $inc: { [`metrics.${field}`]: 1 } },
      { upsert: true }
    );
  }

  private async updateTopQuestion(clientId: string, date: Date, question: string): Promise<void> {
    if (!question || question.trim().length < 5) return;

    const analytics = await Analytics.findOne({ clientId, date, period: 'daily' });
    if (!analytics) return;

    const normalizedQ = question.trim().toLowerCase().slice(0, 200);
    const existing = analytics.topQuestions.find(
      q => q.question.toLowerCase().slice(0, 200) === normalizedQ
    );

    if (existing) {
      existing.count++;
    } else {
      analytics.topQuestions.push({ question: question.trim().slice(0, 200), count: 1 });
    }

    analytics.topQuestions.sort((a, b) => b.count - a.count);
    analytics.topQuestions = analytics.topQuestions.slice(0, 100);
    await analytics.save();
  }

  private async updateTopUnansweredQuestion(clientId: string, date: Date, question: string): Promise<void> {
    if (!question || question.trim().length < 5) return;

    const analytics = await Analytics.findOne({ clientId, date, period: 'daily' });
    if (!analytics) return;

    const normalizedQ = question.trim().toLowerCase().slice(0, 200);
    const existing = (analytics as any).topUnansweredQuestions?.find(
      (q: any) => q.question.toLowerCase().slice(0, 200) === normalizedQ
    );

    if (existing) {
      existing.count++;
    } else {
      if (!analytics.topUnansweredQuestions) (analytics as any).topUnansweredQuestions = [];
      analytics.topUnansweredQuestions.push({ question: question.trim().slice(0, 200), count: 1 });
    }

    analytics.topUnansweredQuestions.sort((a, b) => b.count - a.count);
    analytics.topUnansweredQuestions = analytics.topUnansweredQuestions.slice(0, 50);
    await analytics.save();
  }

  private async updateInsightTopic(clientId: string, date: Date, topic: string, category: string): Promise<void> {
    const analytics = await Analytics.findOne({ clientId, date, period: 'daily' });
    if (!analytics) return;

    const existing = analytics.insightTopics?.find(t => t.topic === topic && t.category === category);
    if (existing) {
      existing.count++;
    } else {
      if (!analytics.insightTopics) (analytics as any).insightTopics = [];
      analytics.insightTopics.push({ topic, category, count: 1 });
    }

    await analytics.save();
  }

  /**
   * Recompute the stored averageConfidenceScore from the sum and count accumulators.
   * Called after each message update.
   */
  private async recomputeAverageConfidence(clientId: string, date: Date): Promise<void> {
    const analytics = await Analytics.findOne({ clientId, date, period: 'daily' });
    if (!analytics) return;

    const sum = analytics.metrics.confidenceScoreSum ?? 0;
    const count = analytics.metrics.confidenceScoreCount ?? 0;

    if (count > 0) {
      analytics.metrics.averageConfidenceScore = Math.round((sum / count) * 10000) / 10000;
      await analytics.save();
    }
  }

  private getDateOnly(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private getMonthStart(date: Date): Date {
    const d = new Date(date);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }
}

export const analyticsService = new AnalyticsService();
