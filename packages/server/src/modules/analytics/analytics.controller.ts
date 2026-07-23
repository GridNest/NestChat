import { Request, Response } from 'express';
import { analyticsService } from './analytics.service';

export class AnalyticsController {
  async getDashboardStats(req: Request, res: Response) {
    try {
      const { clientId } = req.params;
      const days = parseInt(req.query.days as string) || 30;

      const stats = await analyticsService.getDashboardStats(clientId, days);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get dashboard stats',
      });
    }
  }

  async getChatAnalytics(req: Request, res: Response) {
    try {
      const { clientId } = req.params;
      const { startDate, endDate, status, page, limit } = req.query;

      const filters: any = {};
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (status) filters.status = status;
      if (page) filters.page = parseInt(page as string);
      if (limit) filters.limit = parseInt(limit as string);

      const analytics = await analyticsService.getChatAnalytics(clientId, filters);

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get chat analytics',
      });
    }
  }

  async trackVisitor(req: Request, res: Response) {
    try {
      const { clientId, visitorId } = req.body;

      if (!clientId || !visitorId) {
        return res.status(400).json({
          success: false,
          error: 'clientId and visitorId are required',
        });
      }

      await analyticsService.trackVisitor(clientId, visitorId);

      res.json({
        success: true,
        message: 'Visitor tracked',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to track visitor',
      });
    }
  }

  async getGlobalStats(req: Request, res: Response) {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const Analytics = (await import('./analytics.model')).Analytics;
      
      const globalStats = await Analytics.aggregate([
        {
          $match: {
            date: { $gte: startDate },
            period: 'daily',
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
          },
        },
      ]);

      const dailyTrend = await Analytics.aggregate([
        {
          $match: {
            date: { $gte: startDate },
            period: 'daily',
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            visitors: { $sum: '$metrics.visitors' },
            chats: { $sum: '$metrics.chats' },
            leads: { $sum: '$metrics.leads' },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);

      const stats = globalStats[0] || {
        totalVisitors: 0,
        totalChats: 0,
        totalLeads: 0,
        totalCompletedInquiries: 0,
        totalAbandonedInquiries: 0,
      };

      res.json({
        success: true,
        data: {
          summary: stats,
          dailyTrend,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get global stats',
      });
    }
  }
}

export const analyticsController = new AnalyticsController();
