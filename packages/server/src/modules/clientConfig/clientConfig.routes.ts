import { Router } from 'express';
import { ClientConfigController } from './clientConfig.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router: Router = Router();

router.get('/:clientId', authenticate, ClientConfigController.getByClientId);
router.put('/:clientId', authenticate, ClientConfigController.update);
router.post('/:clientId/reset', authenticate, ClientConfigController.reset);
router.get('/:clientId/preview', authenticate, ClientConfigController.getPreview);
router.delete('/:clientId', authenticate, ClientConfigController.delete);

export const clientConfigRoutes = router;
