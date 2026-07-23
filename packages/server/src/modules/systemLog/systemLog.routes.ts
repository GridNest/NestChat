import { Router } from 'express';
import { systemLogController } from './systemLog.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router: Router = Router();

router.get(
  '/',
  authenticate,
  systemLogController.getLogs
);

router.get(
  '/stats',
  authenticate,
  systemLogController.getLogStats
);

router.post(
  '/cleanup',
  authenticate,
  systemLogController.cleanupLogs
);

export const systemLogRoutes = router;
