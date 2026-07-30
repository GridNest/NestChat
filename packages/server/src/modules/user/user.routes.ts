import { Router } from 'express';
import { UserController } from './user.controller.js';
import { authenticate, authorize, enforceTenantIsolation } from '../../middleware/auth.js';

const router: Router = Router();

router.get('/', authenticate, authorize('admin'), enforceTenantIsolation, UserController.list);
router.get('/stats', authenticate, authorize('admin'), UserController.getStats);
router.get('/:id', authenticate, authorize('admin'), enforceTenantIsolation, UserController.getById);
router.post('/', authenticate, authorize('admin'), UserController.create);
router.put('/:id', authenticate, authorize('admin'), UserController.update);
router.delete('/:id', authenticate, authorize('admin'), UserController.delete);

export const userRoutes = router;
