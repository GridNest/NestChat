import { Router } from 'express';
import { TranslationController } from './translation.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router: Router = Router();

router.use(authenticate);

router.get(
  '/:clientId',
  authorize('admin'),
  TranslationController.list
);

router.get(
  '/:clientId/map',
  authorize('admin'),
  TranslationController.listMap
);

router.post(
  '/:clientId',
  authorize('admin'),
  TranslationController.upsert
);

router.post(
  '/:clientId/bulk',
  authorize('admin'),
  TranslationController.bulkUpsert
);

router.delete(
  '/:clientId',
  authorize('admin'),
  TranslationController.delete
);

router.delete(
  '/:clientId/language/:language',
  authorize('admin'),
  TranslationController.deleteByLanguage
);

export const translationRoutes = router;