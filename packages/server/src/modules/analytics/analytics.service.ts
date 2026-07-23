import { Analytics, IAnalytics } from './analytics.model';
import { ChatAnalytics, IChatAnalytics } from './chatAnalytics.model';

export class AnalyticsService {
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

    const stats = totals[0] || {
      totalVisitors: 0,
      totalChats: 0,
      totalLeads: 0,
      totalCompletedInquiries: 0,
      totalAbandonedInquiries: 0,
      totalMessages: 0,
      avgResponseTime: 0,
      avgConversationDuration: 0,
    };

    const conversionRate = stats.totalVisitors > 0
      ? (stats.totalLeads / stats.totalVisitors) * 100
      : 0;

    return {
      summary: {
        ...stats,
        conversionRate,
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
