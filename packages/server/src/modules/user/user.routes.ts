import { Router } from 'express';
import { UserController } from './user.controller';
import { authenticate } from '../../middleware/auth';

const router: Router = Router();

router.get('/', authenticate, UserController.list);
router.get('/stats', authenticate, UserController.getStats);
router.get('/:id', authenticate, UserController.getById);
router.post('/', authenticate, UserController.create);
router.put('/:id', authenticate, UserController.update);
router.delete('/:id', authenticate, UserController.delete);

export const userRoutes = router;
