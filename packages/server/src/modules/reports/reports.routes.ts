import { Router } from 'express';
import { reportsController } from './reports.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router: Router = Router();

router.get(
  '/:clientId/export',
  authenticate,
  reportsController.generateReport
);

router.get(
  '/:clientId/preview',
  authenticate,
  reportsController.getReportPreview
);

export const reportsRoutes = router;
