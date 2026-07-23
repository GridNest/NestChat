import { Router } from 'express';
import { SettingsController } from './settings.controller';
import { authenticate } from '../../middleware/auth';

const router: Router = Router();

router.get('/', authenticate, SettingsController.get);
router.put('/', authenticate, SettingsController.update);

export const settingsRoutes = router;
