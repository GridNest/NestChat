import { Router } from 'express';
import { ClientModuleController } from './clientModule.controller';
import { authenticate } from '../../middleware/auth';

const router: Router = Router();

router.get('/:clientId', authenticate, ClientModuleController.getByClientId);
router.put('/:clientId', authenticate, ClientModuleController.update);
router.put('/:clientId/:moduleName', authenticate, ClientModuleController.toggleModule);
router.delete('/:clientId/:moduleName', authenticate, ClientModuleController.delete);

export const clientModuleRoutes = router;
