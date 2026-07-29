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

// Admin intelligence insights — top topics, knowledge gaps, confidence trends
router.get(
  '/:clientId/insights',
  authenticate,
  analyticsController.getInsights.bind(analyticsController)
);

export const analyticsRoutes = router;
