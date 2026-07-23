import { Router } from 'express';
import { ClientThemeController } from './clientTheme.controller';
import { authenticate } from '../../middleware/auth';

const router: Router = Router();

router.get('/:clientId', authenticate, ClientThemeController.getByClientId);
router.put('/:clientId', authenticate, ClientThemeController.update);
router.delete('/:clientId', authenticate, ClientThemeController.delete);

export const clientThemeRoutes = router;
