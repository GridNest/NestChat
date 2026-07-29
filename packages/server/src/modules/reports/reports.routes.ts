import { Router } from 'express';
import { reportsController } from './reports.controller.js';
import { authenticate, enforceTenantIsolation } from '../../middleware/auth.js';

const router: Router = Router();

router.get(
  '/:clientId/export',
  authenticate,
  enforceTenantIsolation,
  reportsController.generateReport
);

router.get(
  '/:clientId/preview',
  authenticate,
  enforceTenantIsolation,
  reportsController.getReportPreview
);

export const reportsRoutes = router;
