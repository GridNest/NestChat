import { ClientModel } from '../client/client.model';
import { ChatModel } from '../chat/chat.model';
import { InquiryModel } from '../inquiry/inquiry.model';
import { KnowledgeModel } from '../knowledge/knowledge.model';
import { FAQModel } from '../faq/faq.model';
import { AuditLogModel } from '../auditLog/auditLog.model';

export class AdminDashboardService {
  static async getSuperAdminStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalClients,
      activeClients,
      inactiveClients,
      totalConversations,
      todayConversations,
      totalLeads,
      todayLeads,
      totalKnowledge,
      totalFAQs,
      recentActivities,
    ] = await Promise.all([
      ClientModel.countDocuments(),
      ClientModel.countDocuments({ status: 'active' }),
      ClientModel.countDocuments({ status: 'inactive' }),
      ChatModel.countDocuments(),
      ChatModel.countDocuments({ createdAt: { $gte: today } }),
      InquiryModel.countDocuments(),
      InquiryModel.countDocuments({ createdAt: { $gte: today } }),
      KnowledgeModel.countDocuments(),
      FAQModel.countDocuments(),
      AuditLogModel.find()
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    return {
      totalClients,
      activeClients,
      inactiveClients,
      totalConversations,
      todayConversations,
      totalLeads,
      todayLeads,
      totalKnowledge,
      totalFAQs,
      recentActivities,
    };
  }

  static async getClientAdminStats(clientId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      todayVisitors,
      todayChats,
      todayInquiries,
      activeKnowledge,
      recentConversations,
    ] = await Promise.all([
      ChatModel.distinct('visitorId', { clientId, createdAt: { $gte: today } }).then(ids => ids.length),
      ChatModel.countDocuments({ clientId, createdAt: { $gte: today } }),
      InquiryModel.countDocuments({ clientId, createdAt: { $gte: today } }),
      KnowledgeModel.countDocuments({ clientId, status: 'published' }),
      ChatModel.find({ clientId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('visitorId', 'name email'),
    ]);

    return {
      todayVisitors,
      todayChats,
      todayInquiries,
      activeKnowledge,
      recentConversations,
    };
  }

  static async getSystemHealth() {
    const dbState = {
      status: 'connected',
      readyState: 0,
    };

    try {
      const mongoose = await import('mongoose');
      dbState.readyState = mongoose.default.connection.readyState;
      dbState.status = dbState.readyState === 1 ? 'connected' : 'disconnected';
    } catch (error) {
      dbState.status = 'error';
    }

    return {
      database: dbState,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date(),
    };
  }
}
