import { Router } from 'express';
import { RoleController } from './role.controller';
import { authenticate } from '../../middleware/auth';

const router: Router = Router();

router.post('/', authenticate, RoleController.create);
router.get('/', authenticate, RoleController.list);
router.get('/:id', authenticate, RoleController.getById);
router.put('/:id', authenticate, RoleController.update);
router.delete('/:id', authenticate, RoleController.delete);

export const roleRoutes = router;
