import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authenticate } from '../../middleware/auth';

const router: Router = Router();

router.get('/dashboard', authenticate, AdminController.getDashboard);
router.get('/dashboard/client/:clientId', authenticate, AdminController.getClientDashboard);
router.get('/health', authenticate, AdminController.getSystemHealth);
router.get('/audit-logs', authenticate, AdminController.getAuditLogs);
router.get('/search', authenticate, AdminController.globalSearch);

export const adminRoutes = router;
