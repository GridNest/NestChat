import { Router } from 'express';
import { WidgetController } from './widget.controller.js';
import { widgetLimiter } from '../../middleware/rateLimiter.js';

const router: Router = Router();

router.get(
  '/:clientId/config',
  widgetLimiter,
  WidgetController.getConfig
);

router.get(
  '/:clientId/faq',
  widgetLimiter,
  WidgetController.getFAQs
);

router.get(
  '/:clientId/faq/categories',
  widgetLimiter,
  WidgetController.getFAQCategories
);

router.get(
  '/:clientId/faq/category/:category',
  widgetLimiter,
  WidgetController.getFAQByCategory
);

router.get(
  '/:clientId/knowledge',
  widgetLimiter,
  WidgetController.getKnowledge
);

router.get(
  '/:clientId/knowledge/search',
  widgetLimiter,
  WidgetController.searchKnowledge
);

export const widgetRoutes = router;
