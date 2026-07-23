import { Router } from 'express';
import { ClientConfigController } from './clientConfig.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router: Router = Router();

router.get('/:clientId', authenticate, ClientConfigController.getByClientId);
router.put('/:clientId', authenticate, ClientConfigController.update);
router.delete('/:clientId', authenticate, ClientConfigController.delete);

export const clientConfigRoutes = router;
