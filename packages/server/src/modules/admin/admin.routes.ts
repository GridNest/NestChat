import { Router } from 'express';
import { AdminController } from './admin.controller.js';
import { authenticate, enforceTenantIsolation } from '../../middleware/auth.js';

const router: Router = Router();

router.get('/dashboard', authenticate, AdminController.getDashboard);
router.get('/dashboard/client/:clientId', authenticate, AdminController.getClientDashboard);
router.get('/health', authenticate, AdminController.getSystemHealth);
router.get('/audit-logs', authenticate, enforceTenantIsolation, AdminController.getAuditLogs);
router.get('/search', authenticate, AdminController.globalSearch);
router.get('/knowledge', authenticate, enforceTenantIsolation, AdminController.listKnowledge);
router.get('/faqs', authenticate, enforceTenantIsolation, AdminController.listFAQs);
router.get('/faqs/export', authenticate, enforceTenantIsolation, AdminController.exportFAQs);
router.get('/chats', authenticate, enforceTenantIsolation, AdminController.listChats);
router.delete('/chats/:id', authenticate, AdminController.deleteChat);
router.post('/chats/bulk-delete', authenticate, AdminController.bulkDeleteChats);
router.delete('/chats', authenticate, AdminController.bulkDeleteChats);
router.get('/inquiries', authenticate, enforceTenantIsolation, AdminController.listInquiries);
router.get('/unanswered', authenticate, enforceTenantIsolation, AdminController.listUnanswered);
router.post('/reset-database', authenticate, AdminController.resetDatabase);

export const adminRoutes = router;
