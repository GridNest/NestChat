import { Request, Response, NextFunction } from 'express';
import { AdminDashboardService } from './admin.service';
import { AuditLogService } from '../auditLog/auditLog.service';
import { AuthRequest } from '../../middleware/auth';

export class AdminController {
  static async getDashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      let stats;
      if (req.user?.role === 'admin') {
        stats = await AdminDashboardService.getSuperAdminStats();
      } else if (req.user?.clientId) {
        stats = await AdminDashboardService.getClientAdminStats(req.user.clientId);
      } else {
        stats = await AdminDashboardService.getSuperAdminStats();
      }
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  static async getClientDashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { clientId } = req.params;
      const stats = await AdminDashboardService.getClientAdminStats(clientId);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  static async getSystemHealth(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const health = await AdminDashboardService.getSystemHealth();
      res.json({ success: true, data: health });
    } catch (error) {
      next(error);
    }
  }

  static async getAuditLogs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await AuditLogService.list(req.query as any);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async globalSearch(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { q } = req.query;
      if (!q || (q as string).length < 2) {
        res.json({ success: true, data: [] });
        return;
      }

      const results: any[] = [];
      const clientId = req.user?.clientId;

      // Search clients (super admin only)
      if (req.user?.role === 'admin') {
        const { ClientModel } = await import('../client/client.model');
        const clients = await ClientModel.find({
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { companyName: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } },
          ],
        }).limit(5);

        clients.forEach(client => {
          results.push({
            type: 'client',
            id: client._id.toString(),
            title: client.companyName,
            subtitle: client.email,
            url: `/clients/${client._id}`,
          });
        });
      }

      // Search knowledge
      const { KnowledgeModel } = await import('../knowledge/knowledge.model');
      const knowledgeFilter: any = {
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { content: { $regex: q, $options: 'i' } },
        ],
        isDeleted: false,
      };
      if (clientId) knowledgeFilter.clientId = clientId;

      const knowledge = await KnowledgeModel.find(knowledgeFilter).limit(5);
      knowledge.forEach(k => {
        results.push({
          type: 'knowledge',
          id: k._id.toString(),
          title: k.title,
          subtitle: k.category || 'Uncategorized',
          url: `/knowledge/${k._id}/edit`,
        });
      });

      // Search FAQs
      const { FAQModel } = await import('../faq/faq.model');
      const faqFilter: any = {
        $or: [
          { question: { $regex: q, $options: 'i' } },
          { answer: { $regex: q, $options: 'i' } },
        ],
      };
      if (clientId) faqFilter.clientId = clientId;

      const faqs = await FAQModel.find(faqFilter).limit(5);
      faqs.forEach(f => {
        results.push({
          type: 'faq',
          id: f._id.toString(),
          title: f.question,
          subtitle: f.category || 'Uncategorized',
          url: `/faqs/${f._id}/edit`,
        });
      });

      // Search inquiries
      const { InquiryModel } = await import('../inquiry/inquiry.model');
      const inquiryFilter: any = {
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
          { service: { $regex: q, $options: 'i' } },
        ],
      };
      if (clientId) inquiryFilter.clientId = clientId;

      const inquiries = await InquiryModel.find(inquiryFilter).limit(5);
      inquiries.forEach(i => {
        results.push({
          type: 'inquiry',
          id: i._id.toString(),
          title: i.name,
          subtitle: i.email,
          url: `/inquiries/${i._id}`,
        });
      });

      res.json({ success: true, data: results.slice(0, 10) });
    } catch (error) {
      next(error);
    }
  }
}
