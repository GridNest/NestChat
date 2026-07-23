import { Router } from 'express';
import { ClientThemeController } from './clientTheme.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router: Router = Router();

router.get('/:clientId', authenticate, ClientThemeController.getByClientId);
router.put('/:clientId', authenticate, ClientThemeController.update);
router.delete('/:clientId', authenticate, ClientThemeController.delete);

export const clientThemeRoutes = router;
