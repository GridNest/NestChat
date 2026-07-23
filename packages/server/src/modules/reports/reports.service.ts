import { Analytics } from '../analytics/analytics.model.js';
import { ChatAnalytics } from '../analytics/chatAnalytics.model.js';
import { ChatModel } from '../chat/chat.model.js';
import { InquiryModel } from '../inquiry/inquiry.model.js';
import { KnowledgeModel } from '../knowledge/knowledge.model.js';
import { FAQModel } from '../faq/faq.model.js';

export class ReportsService {
  async generateReport(
    clientId: string,
    type: 'chats' | 'leads' | 'visitors' | 'knowledge' | 'faq' | 'inquiries',
    startDate: Date,
    endDate: Date
  ): Promise<{ data: any[]; headers: string[] }> {
    switch (type) {
      case 'chats':
        return this.generateChatsReport(clientId, startDate, endDate);
      case 'leads':
        return this.generateLeadsReport(clientId, startDate, endDate);
      case 'visitors':
        return this.generateVisitorsReport(clientId, startDate, endDate);
      case 'knowledge':
        return this.generateKnowledgeReport(clientId, startDate, endDate);
      case 'faq':
        return this.generateFAQReport(clientId, startDate, endDate);
      case 'inquiries':
        return this.generateInquiriesReport(clientId, startDate, endDate);
      default:
        throw new Error(`Invalid report type: ${type}`);
    }
  }

  private async generateChatsReport(clientId: string, startDate: Date, endDate: Date) {
    const chats = await ChatAnalytics.find({
      clientId,
      startTime: { $gte: startDate, $lte: endDate },
    }).sort({ startTime: -1 }).lean();

    const headers = [
      'Date',
      'Visitor ID',
      'Duration (s)',
      'Messages',
      'Status',
      'Language',
      'Device',
      'Browser',
      'Fallback Count',
    ];

    const data = chats.map(chat => [
      chat.startTime.toISOString().split('T')[0],
      chat.visitorId,
      chat.duration,
      chat.messageCount,
      chat.status,
      chat.language,
      chat.device || 'Unknown',
      chat.browser || 'Unknown',
      chat.fallbackCount,
    ]);

    return { headers, data };
  }

  private async generateLeadsReport(clientId: string, startDate: Date, endDate: Date) {
    const inquiries = await InquiryModel.find({
      clientId,
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $in: ['new', 'contacted', 'qualified'] },
    }).sort({ createdAt: -1 }).lean();

    const headers = [
      'Date',
      'Visitor ID',
      'Name',
      'Email',
      'Phone',
      'Status',
      'Source',
      'Message',
    ];

    const data = inquiries.map((inquiry: any) => [
      inquiry.createdAt.toISOString().split('T')[0],
      inquiry.visitorId,
      inquiry.name || 'N/A',
      inquiry.email || 'N/A',
      inquiry.phone || 'N/A',
      inquiry.status,
      inquiry.source || 'chatbot',
      inquiry.details || 'N/A',
    ]);

    return { headers, data };
  }

  private async generateVisitorsReport(clientId: string, startDate: Date, endDate: Date) {
    const analytics = await Analytics.find({
      clientId,
      date: { $gte: startDate, $lte: endDate },
      period: 'daily',
    }).sort({ date: 1 }).lean();

    const headers = [
      'Date',
      'Visitors',
      'Chats',
      'Leads',
      'Conversion Rate',
      'Avg Response Time (ms)',
      'Avg Duration (s)',
    ];

    const data = analytics.map(day => {
      const conversionRate = day.metrics.visitors > 0
        ? ((day.metrics.leads / day.metrics.visitors) * 100).toFixed(2)
        : '0.00';

      return [
        day.date.toISOString().split('T')[0],
        day.metrics.visitors,
        day.metrics.chats,
        day.metrics.leads,
        `${conversionRate}%`,
        Math.round(day.metrics.averageResponseTime),
        Math.round(day.metrics.averageConversationDuration),
      ];
    });

    return { headers, data };
  }

  private async generateKnowledgeReport(clientId: string, startDate: Date, endDate: Date) {
    const knowledge = await KnowledgeModel.find({ clientId }).lean();

    const headers = [
      'Title',
      'Category',
      'Status',
      'Created Date',
      'Updated Date',
    ];

    const data = knowledge.map((k: any) => [
      k.title,
      k.category || 'Uncategorized',
      k.isActive ? 'Active' : 'Inactive',
      k.createdAt.toISOString().split('T')[0],
      k.updatedAt.toISOString().split('T')[0],
    ]);

    return { headers, data };
  }

  private async generateFAQReport(clientId: string, startDate: Date, endDate: Date) {
    const faqs = await FAQModel.find({ clientId }).lean();

    const headers = [
      'Question',
      'Answer',
      'Category',
      'Status',
      'Created Date',
    ];

    const data = faqs.map((faq: any) => [
      faq.question,
      faq.answer,
      faq.category || 'Uncategorized',
      faq.isActive ? 'Active' : 'Inactive',
      faq.createdAt.toISOString().split('T')[0],
    ]);

    return { headers, data };
  }

  private async generateInquiriesReport(clientId: string, startDate: Date, endDate: Date) {
    const inquiries = await InquiryModel.find({
      clientId,
      createdAt: { $gte: startDate, $lte: endDate },
    }).sort({ createdAt: -1 }).lean();

    const headers = [
      'Date',
      'Visitor ID',
      'Status',
      'Source',
      'Message',
      'Name',
      'Email',
      'Phone',
      'Created Date',
      'Updated Date',
    ];

    const data = inquiries.map((inquiry: any) => [
      inquiry.createdAt.toISOString().split('T')[0],
      inquiry.visitorId,
      inquiry.status,
      inquiry.source || 'chatbot',
      inquiry.details || 'N/A',
      inquiry.name || 'N/A',
      inquiry.email || 'N/A',
      inquiry.phone || 'N/A',
      inquiry.createdAt.toISOString().split('T')[0],
      inquiry.updatedAt.toISOString().split('T')[0],
    ]);

    return { headers, data };
  }

  convertToCSV(headers: string[], data: any[][]): string {
    const csvRows = [];
    
    csvRows.push(headers.join(','));
    
    for (const row of data) {
      const values = row.map(value => {
        const escaped = String(value).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  }

  generateFilename(type: string, startDate: Date, endDate: Date): string {
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];
    return `${type}_report_${start}_to_${end}.csv`;
  }
}

export const reportsService = new ReportsService();
