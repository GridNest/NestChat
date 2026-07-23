import { Router } from 'express';
import { SettingsController } from './settings.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router: Router = Router();

router.get('/', authenticate, SettingsController.get);
router.put('/', authenticate, SettingsController.update);

export const settingsRoutes = router;
