import { Router } from 'express';
import { ClientController } from './client.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router: Router = Router();

router.post('/', authenticate, authorize('admin'), ClientController.create);
router.get('/', authenticate, authorize('admin'), ClientController.list);
router.get('/stats', authenticate, authorize('admin'), ClientController.getStats);
router.get('/clientId/:clientId', authenticate, authorize('admin'), ClientController.getByClientId);
router.get('/:id', authenticate, authorize('admin'), ClientController.getById);
router.put('/:id', authenticate, authorize('admin'), ClientController.update);
router.delete('/:id', authenticate, authorize('admin'), ClientController.delete);

export const clientRoutes = router;
