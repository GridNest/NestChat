import { Router } from 'express';
import { UserRoleController } from './userRole.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router: Router = Router();

router.post('/', authenticate, UserRoleController.assign);
router.get('/user/:userId/client/:clientId', authenticate, UserRoleController.getByUserAndClient);
router.get('/client/:clientId', authenticate, UserRoleController.getByClient);
router.get('/user/:userId', authenticate, UserRoleController.getByUser);
router.put('/:id', authenticate, UserRoleController.update);
router.delete('/:id', authenticate, UserRoleController.remove);
router.delete('/user/:userId/client/:clientId', authenticate, UserRoleController.removeByUserAndClient);
router.get('/check-permission', authenticate, UserRoleController.checkPermission);

export const userRoleRoutes = router;
