import { Router } from 'express';
import { FAQController } from './faq.controller';
import { validate } from '../../middleware/validate';
import { authenticate, authorize } from '../../middleware/auth';
import {
  createFAQSchema,
  updateFAQSchema,
  getFAQSchema,
  listFAQSchema,
  searchFAQSchema,
} from './faq.validation';

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

router.use(authenticate);

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
