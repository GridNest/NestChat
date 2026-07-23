import { Router } from 'express';
import { analyticsController } from './analytics.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router: Router = Router();

router.get(
  '/global/stats',
  authenticate,
  analyticsController.getGlobalStats
);

router.get(
  '/:clientId/dashboard',
  authenticate,
  analyticsController.getDashboardStats
);

router.get(
  '/:clientId/chats',
  authenticate,
  analyticsController.getChatAnalytics
);

router.post(
  '/track/visitor',
  analyticsController.trackVisitor
);

export const analyticsRoutes = router;
