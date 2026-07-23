import { Router } from 'express';
import { ClientController } from './client.controller';
import { authenticate, AuthRequest } from '../../middleware/auth';

const router: Router = Router();

router.post('/', authenticate, ClientController.create);
router.get('/', authenticate, ClientController.list);
router.get('/stats', authenticate, ClientController.getStats);
router.get('/clientId/:clientId', authenticate, ClientController.getByClientId);
router.get('/:id', authenticate, ClientController.getById);
router.put('/:id', authenticate, ClientController.update);
router.delete('/:id', authenticate, ClientController.delete);

export const clientRoutes = router;
