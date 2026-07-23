import { Router } from 'express';
import { KnowledgeController } from './knowledge.controller';
import { validate } from '../../middleware/validate';
import { authenticate, authorize } from '../../middleware/auth';
import {
  createKnowledgeSchema,
  updateKnowledgeSchema,
  getKnowledgeSchema,
  listKnowledgeSchema,
  searchKnowledgeSchema,
} from './knowledge.validation';

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

router.use(authenticate);

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
