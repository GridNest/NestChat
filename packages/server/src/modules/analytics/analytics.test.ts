import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Analytics } from './analytics.model';
import { ChatAnalytics } from './chatAnalytics.model';
import { analyticsService } from './analytics.service';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Analytics.deleteMany({});
  await ChatAnalytics.deleteMany({});
});

describe('Analytics Service', () => {
  const testClientId = new mongoose.Types.ObjectId().toString();
  const testVisitorId = 'visitor-123';

  describe('trackVisitor', () => {
    it('should create daily analytics entry for visitor', async () => {
      await analyticsService.trackVisitor(testClientId, testVisitorId);

      const analytics = await Analytics.findOne({
        clientId: testClientId,
        period: 'daily',
      });

      expect(analytics).toBeTruthy();
      expect(analytics?.metrics.visitors).toBe(1);
    });

    it('should increment visitor count on multiple calls', async () => {
      await analyticsService.trackVisitor(testClientId, testVisitorId);
      await analyticsService.trackVisitor(testClientId, 'visitor-456');

      const analytics = await Analytics.findOne({
        clientId: testClientId,
        period: 'daily',
      });

      expect(analytics?.metrics.visitors).toBe(2);
    });
  });

  describe('trackChat', () => {
    it('should create daily analytics entry for chat', async () => {
      const conversationId = new mongoose.Types.ObjectId().toString();
      await analyticsService.trackChat(testClientId, conversationId, testVisitorId);

      const analytics = await Analytics.findOne({
        clientId: testClientId,
        period: 'daily',
      });

      expect(analytics).toBeTruthy();
      expect(analytics?.metrics.chats).toBe(1);
    });
  });

  describe('trackLead', () => {
    it('should increment lead count', async () => {
      await analyticsService.trackLead(testClientId);

      const analytics = await Analytics.findOne({
        clientId: testClientId,
        period: 'daily',
      });

      expect(analytics?.metrics.leads).toBe(1);
    });
  });

  describe('trackFallback', () => {
    it('should increment fallback count', async () => {
      await analyticsService.trackFallback(testClientId);

      const analytics = await Analytics.findOne({
        clientId: testClientId,
        period: 'daily',
      });

      expect(analytics?.metrics.fallbackCount).toBe(1);
    });
  });

  describe('trackLanguage', () => {
    it('should track language distribution', async () => {
      await analyticsService.trackLanguage(testClientId, 'en');
      await analyticsService.trackLanguage(testClientId, 'hi');
      await analyticsService.trackLanguage(testClientId, 'en');

      const analytics = await Analytics.findOne({
        clientId: testClientId,
        period: 'daily',
      });

      expect(analytics?.languageDistribution).toEqual({ en: 2, hi: 1 });
    });
  });

  describe('getDashboardStats', () => {
    it('should return empty stats when no data', async () => {
      const stats = await analyticsService.getDashboardStats(testClientId, 30);

      expect(stats.summary.totalVisitors).toBe(0);
      expect(stats.summary.totalChats).toBe(0);
      expect(stats.summary.totalLeads).toBe(0);
      expect(stats.dailyStats).toEqual([]);
    });

    it('should aggregate stats correctly', async () => {
      await analyticsService.trackVisitor(testClientId, testVisitorId);
      await analyticsService.trackChat(testClientId, 'conv1', testVisitorId);
      await analyticsService.trackLead(testClientId);

      const stats = await analyticsService.getDashboardStats(testClientId, 30);

      expect(stats.summary.totalVisitors).toBe(1);
      expect(stats.summary.totalChats).toBe(1);
      expect(stats.summary.totalLeads).toBe(1);
    });
  });

  describe('createChatAnalytics', () => {
    it('should create chat analytics record', async () => {
      const chatData = {
        conversationId: new mongoose.Types.ObjectId(),
        clientId: new mongoose.Types.ObjectId(testClientId),
        visitorId: testVisitorId,
        startTime: new Date(),
        status: 'active' as const,
      };

      const result = await analyticsService.createChatAnalytics(chatData);

      expect(result).toBeTruthy();
      expect(result.visitorId).toBe(testVisitorId);
      expect(result.status).toBe('active');
    });
  });
});
