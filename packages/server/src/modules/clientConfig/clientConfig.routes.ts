import { Router } from 'express';
import { ClientConfigController } from './clientConfig.controller';
import { authenticate } from '../../middleware/auth';

const router: Router = Router();

router.get('/:clientId', authenticate, ClientConfigController.getByClientId);
router.put('/:clientId', authenticate, ClientConfigController.update);
router.delete('/:clientId', authenticate, ClientConfigController.delete);

export const clientConfigRoutes = router;
