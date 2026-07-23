import { Router } from 'express';
import { WidgetGeneratorController } from './widgetGenerator.controller';
import { authenticate } from '../../middleware/auth';

const router: Router = Router();

router.get('/:clientId/script', authenticate, WidgetGeneratorController.generateScript);
router.post('/:clientId/secret-key', authenticate, WidgetGeneratorController.regenerateSecretKey);
router.put('/:clientId/settings', authenticate, WidgetGeneratorController.updateWidgetSettings);
router.put('/:clientId/domains', authenticate, WidgetGeneratorController.updateAllowedDomains);
router.post('/:clientId/domains', authenticate, WidgetGeneratorController.addAllowedDomain);
router.delete('/:clientId/domains/:domain', authenticate, WidgetGeneratorController.removeAllowedDomain);
router.get('/:clientId/guides', authenticate, WidgetGeneratorController.getInstallationGuides);
router.get('/:clientId/info', authenticate, WidgetGeneratorController.getWidgetInfo);

export const widgetGeneratorRoutes = router;
