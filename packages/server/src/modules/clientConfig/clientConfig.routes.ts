import { Router } from 'express';
import { ClientConfigController } from './clientConfig.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router: Router = Router();

router.get('/widget/:clientId', ClientConfigController.getWidgetConfig);

router.use(authenticate);

router.get('/', authorize('admin'), ClientConfigController.getAll);
router.get('/:clientId', ClientConfigController.getByClientId);
router.put('/', ClientConfigController.update);

export const clientConfigRoutes = router;
