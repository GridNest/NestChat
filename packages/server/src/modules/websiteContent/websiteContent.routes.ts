import { Router } from 'express';
import { WebsiteContentController } from './websiteContent.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router: Router = Router();

router.get('/:clientId/status', authenticate, WebsiteContentController.getCrawlStatus);
router.post('/:clientId/sync', authenticate, WebsiteContentController.syncWebsite);
router.get('/:clientId', authenticate, WebsiteContentController.getContent);
router.get('/:clientId/categories', authenticate, WebsiteContentController.getCategories);
router.get('/:clientId/search', WebsiteContentController.searchContent);

export const websiteContentRoutes = router;
