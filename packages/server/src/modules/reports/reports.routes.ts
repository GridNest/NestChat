import { Router } from 'express';
import { reportsController } from './reports.controller';
import { authenticate } from '../../middleware/auth';

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
