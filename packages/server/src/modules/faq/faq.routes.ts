import { Router } from 'express';
import { FAQController } from './faq.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import {
  createFAQSchema,
  updateFAQSchema,
  getFAQSchema,
  listFAQSchema,
  searchFAQSchema,
} from './faq.validation.js';

const router: Router = Router();

router.get(
  '/widget/:clientId',
  FAQController.listAll
);

router.get(
  '/widget/:clientId/categories',
  FAQController.getCategories
);

router.get(
  '/widget/:clientId/category/:category',
  FAQController.getByCategory
);

router.get(
  '/widget/:clientId/search',
  validate(searchFAQSchema),
  FAQController.search
);

router.get(
  '/:clientId/categories',
  FAQController.getCategories
);

router.use(authenticate);

router.get(
  '/template/download',
  FAQController.downloadTemplate
);

router.get(
  '/:clientId',
  validate(listFAQSchema),
  FAQController.list
);

router.post(
  '/',
  authorize('admin'),
  validate(createFAQSchema),
  FAQController.create
);

router.post(
  '/bulk-delete',
  authorize('admin'),
  FAQController.bulkDelete
);

router.post(
  '/bulk-status',
  authorize('admin'),
  FAQController.bulkUpdateStatus
);

router.post(
  '/import/preview',
  authorize('admin'),
  FAQController.importPreview
);

router.post(
  '/import',
  authorize('admin'),
  FAQController.importCsv
);

router.get(
  '/export/:clientId',
  authorize('admin'),
  FAQController.exportCsv
);

router.get(
  '/detail/:id',
  validate(getFAQSchema),
  FAQController.getById
);

router.put(
  '/:id',
  authorize('admin'),
  validate(updateFAQSchema),
  FAQController.update
);

router.delete(
  '/:id',
  authorize('admin'),
  validate(getFAQSchema),
  FAQController.delete
);

export const faqRoutes = router;
