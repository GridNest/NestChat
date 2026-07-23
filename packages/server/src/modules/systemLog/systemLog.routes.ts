import { Router } from 'express';
import { systemLogController } from './systemLog.controller';
import { authenticate } from '../../middleware/auth';

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
