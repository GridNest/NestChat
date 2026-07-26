import { Router } from 'express';
import { KnowledgeController } from './knowledge.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import {
  createKnowledgeSchema,
  updateKnowledgeSchema,
  getKnowledgeSchema,
  listKnowledgeSchema,
  searchKnowledgeSchema,
} from './knowledge.validation.js';

const router: Router = Router();

router.get(
  '/widget/:clientId',
  KnowledgeController.listAll
);

router.get(
  '/widget/:clientId/search',
  validate(searchKnowledgeSchema),
  KnowledgeController.search
);

router.get(
  '/widget/:clientId/:slug',
  KnowledgeController.getBySlug
);

router.get(
  '/:clientId/categories',
  KnowledgeController.getCategories
);

router.use(authenticate);

router.get(
  '/template/download',
  KnowledgeController.downloadTemplate
);

router.get(
  '/:clientId',
  validate(listKnowledgeSchema),
  KnowledgeController.list
);

router.post(
  '/',
  authorize('admin'),
  validate(createKnowledgeSchema),
  KnowledgeController.create
);

router.post(
  '/bulk-delete',
  authorize('admin'),
  KnowledgeController.bulkDelete
);

router.post(
  '/bulk-status',
  authorize('admin'),
  KnowledgeController.bulkUpdateStatus
);

router.post(
  '/import/preview',
  authorize('admin'),
  KnowledgeController.importPreview
);

router.post(
  '/import',
  authorize('admin'),
  KnowledgeController.importCsv
);

router.get(
  '/export/all',
  authorize('admin'),
  KnowledgeController.exportAllCsv
);

router.get(
  '/export/:clientId',
  authorize('admin'),
  KnowledgeController.exportCsv
);

router.get(
  '/detail/:id',
  validate(getKnowledgeSchema),
  KnowledgeController.getById
);

router.put(
  '/:id',
  authorize('admin'),
  validate(updateKnowledgeSchema),
  KnowledgeController.update
);

router.delete(
  '/:id',
  authorize('admin'),
  validate(getKnowledgeSchema),
  KnowledgeController.delete
);

export const knowledgeRoutes = router;
