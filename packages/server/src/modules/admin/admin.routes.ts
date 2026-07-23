import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authenticate } from '../../middleware/auth';

const router: Router = Router();

router.get('/dashboard', authenticate, AdminController.getDashboard);
router.get('/dashboard/client/:clientId', authenticate, AdminController.getClientDashboard);
router.get('/health', authenticate, AdminController.getSystemHealth);
router.get('/audit-logs', authenticate, AdminController.getAuditLogs);
router.get('/search', authenticate, AdminController.globalSearch);
router.get('/knowledge', authenticate, AdminController.listKnowledge);
router.get('/faqs', authenticate, AdminController.listFAQs);
router.get('/chats', authenticate, AdminController.listChats);
router.get('/inquiries', authenticate, AdminController.listInquiries);
router.get('/unanswered', authenticate, AdminController.listUnanswered);

export const adminRoutes = router;
