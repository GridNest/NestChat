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

  static async listAllKnowledge(query: { page?: number; limit?: number; search?: string; category?: string; status?: string }) {
    const { page = 1, limit = 10, search, category, status } = query;
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
    const [items, total] = await Promise.all([
      KnowledgeModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('clientId', 'name companyName').lean(),
      KnowledgeModel.countDocuments(filter),
    ]);
    const knowledge = items.map((item: any) => ({ ...item, id: item._id.toString() }));
    return { knowledge, total, page, limit, pages: Math.ceil(total / limit) };
  }

  static async listAllFAQs(query: { page?: number; limit?: number; search?: string; category?: string }) {
    const { page = 1, limit = 10, search, category } = query;
    const skip = (page - 1) * limit;
    const filter: any = { isDeleted: false };
    if (search) {
      filter.$or = [
        { question: { $regex: search, $options: 'i' } },
        { answer: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) filter.category = category;
    const [items, total] = await Promise.all([
      FAQModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('clientId', 'name companyName').lean(),
      FAQModel.countDocuments(filter),
    ]);
    const faqs = items.map((item: any) => ({ ...item, id: item._id.toString() }));
    return { faqs, total, page, limit, pages: Math.ceil(total / limit) };
  }

  static async listAllChats(query: { page?: number; limit?: number; status?: string }) {
    const { page = 1, limit = 10, status } = query;
    const skip = (page - 1) * limit;
    const filter: any = {};
    if (status) filter.status = status;
    const [items, total] = await Promise.all([
      ChatModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('clientId', 'name companyName').lean(),
      ChatModel.countDocuments(filter),
    ]);
    const chats = items.map((item: any) => ({ ...item, id: item._id.toString() }));
    return { chats, total, page, limit, pages: Math.ceil(total / limit) };
  }

  static async listAllInquiries(query: { page?: number; limit?: number; status?: string; search?: string }) {
    const { page = 1, limit = 10, status, search } = query;
    const skip = (page - 1) * limit;
    const filter: any = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { service: { $regex: search, $options: 'i' } },
      ];
    }
    const [items, total] = await Promise.all([
      InquiryModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('clientId', 'name companyName').lean(),
      InquiryModel.countDocuments(filter),
    ]);
    const inquiries = items.map((item: any) => ({ ...item, id: item._id.toString() }));
    return { inquiries, total, page, limit, pages: Math.ceil(total / limit) };
  }

  static async listAllUnanswered(query: { page?: number; limit?: number }) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    const { UnansweredModel } = await import('../unanswered/unanswered.model.js');
    const [items, total] = await Promise.all([
      UnansweredModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).populate('clientId', 'name companyName').lean(),
      UnansweredModel.countDocuments(),
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
