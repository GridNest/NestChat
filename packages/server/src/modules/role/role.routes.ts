import { Router } from 'express';
import { RoleController } from './role.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router: Router = Router();

router.post('/', authenticate, RoleController.create);
router.get('/', authenticate, RoleController.list);
router.get('/:id', authenticate, RoleController.getById);
router.put('/:id', authenticate, RoleController.update);
router.delete('/:id', authenticate, RoleController.delete);

export const roleRoutes = router;
