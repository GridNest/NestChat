import { ClientModel } from '../client/client.model.js';
import { ChatModel } from '../chat/chat.model.js';
import { InquiryModel } from '../inquiry/inquiry.model.js';
import { KnowledgeModel } from '../knowledge/knowledge.model.js';
import { FAQModel } from '../faq/faq.model.js';
import { AuditLogModel } from '../auditLog/auditLog.model.js';

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

  private static async resolveClientIdFilter(clientId?: string): Promise<any> {
    if (!clientId || clientId === 'all') return undefined;
    const mongoose = await import('mongoose');
    const ids: any[] = [];
    if (mongoose.default.Types.ObjectId.isValid(clientId)) {
      const objId = new mongoose.default.Types.ObjectId(clientId);
      ids.push(objId);
      const client = await ClientModel.findById(objId).lean();
      if (client && (client as any).clientId) {
        ids.push((client as any).clientId);
      }
    } else {
      ids.push(clientId);
      const client = await ClientModel.findOne({ clientId: clientId.trim().toLowerCase() }).lean();
      if (client) {
        ids.push(client._id);
      }
    }
    return ids.length === 1 ? ids[0] : { $in: ids };
  }

  static async listAllKnowledge(query: { page?: number; limit?: number; search?: string; category?: string; status?: string; clientId?: string }) {
    const { page = 1, limit = 10, search, category, status, clientId } = query;
    const skip = (page - 1) * limit;
    const filter: any = { isDeleted: false };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) filter.category = category;
    if (status) filter.isActive = status === 'published';
    if (clientId) {
      const resolved = await this.resolveClientIdFilter(clientId);
      if (resolved) filter.clientId = resolved;
    }
    const [items, total] = await Promise.all([
      KnowledgeModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('clientId', 'name companyName').lean(),
      KnowledgeModel.countDocuments(filter),
    ]);
    const knowledge = items.map((item: any) => ({ ...item, id: item._id.toString() }));
    return { knowledge, total, page, limit, pages: Math.ceil(total / limit) };
  }

  static async listAllFAQs(query: { page?: number; limit?: number; search?: string; category?: string; clientId?: string }) {
    const { page = 1, limit = 10, search, category, clientId } = query;
    const skip = (page - 1) * limit;
    const filter: any = { isDeleted: false };
    if (search) {
      filter.$or = [
        { question: { $regex: search, $options: 'i' } },
        { answer: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) filter.category = category;
    if (clientId) {
      const resolved = await this.resolveClientIdFilter(clientId);
      if (resolved) filter.clientId = resolved;
    }
    const [items, total] = await Promise.all([
      FAQModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('clientId', 'name companyName').lean(),
      FAQModel.countDocuments(filter),
    ]);
    const faqs = items.map((item: any) => ({ ...item, id: item._id.toString() }));
    return { faqs, total, page, limit, pages: Math.ceil(total / limit) };
  }

  static async listAllChats(query: { page?: number; limit?: number; status?: string; clientId?: string }) {
    const { page = 1, limit = 10, status, clientId } = query;
    const skip = (page - 1) * limit;
    const filter: any = {};
    if (status) filter.status = status;
    if (clientId) {
      const resolved = await this.resolveClientIdFilter(clientId);
      if (resolved) filter.clientId = resolved;
    }
    const [items, total] = await Promise.all([
      ChatModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('clientId', 'name companyName').lean(),
      ChatModel.countDocuments(filter),
    ]);
    const chats = items.map((item: any) => ({ ...item, id: item._id.toString() }));
    return { chats, total, page, limit, pages: Math.ceil(total / limit) };
  }

  static async listAllInquiries(query: { page?: number; limit?: number; status?: string; search?: string; clientId?: string; dateFilter?: string }) {
    const { page = 1, limit = 10, status, search, clientId, dateFilter } = query;
    const skip = (page - 1) * limit;
    const filter: any = {};
    if (status) filter.status = status;
    if (clientId) {
      const resolved = await this.resolveClientIdFilter(clientId);
      if (resolved) filter.clientId = resolved;
    }

    if (dateFilter && dateFilter !== 'all') {
      const now = new Date();
      if (dateFilter === 'today') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filter.createdAt = { $gte: startOfDay };
      } else if (dateFilter === 'week') {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        filter.createdAt = { $gte: startOfWeek };
      } else if (dateFilter === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        filter.createdAt = { $gte: startOfMonth };
      }
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { service: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } },
      ];
    }
    const [items, total] = await Promise.all([
      InquiryModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('clientId', 'name companyName').lean(),
      InquiryModel.countDocuments(filter),
    ]);
    const inquiries = items.map((item: any) => ({ ...item, id: item._id.toString() }));
    return { inquiries, total, page, limit, pages: Math.ceil(total / limit) };
  }

  static async listAllUnanswered(query: { page?: number; limit?: number; clientId?: string }) {
    const { page = 1, limit = 10, clientId } = query;
    const skip = (page - 1) * limit;
    const filter: any = {};
    if (clientId) {
      const resolved = await this.resolveClientIdFilter(clientId);
      if (resolved) filter.clientId = resolved;
    }
    const { UnansweredModel } = await import('../unanswered/unanswered.model.js');
    const [items, total] = await Promise.all([
      UnansweredModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('clientId', 'name companyName').lean(),
      UnansweredModel.countDocuments(filter),
    ]);
    const questions = items.map((item: any) => ({ ...item, id: item._id.toString() }));
    return { questions, total, page, limit, pages: Math.ceil(total / limit) };
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
