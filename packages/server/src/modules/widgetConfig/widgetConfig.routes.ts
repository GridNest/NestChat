import { Router } from 'express';
import { WidgetConfigController } from './widgetConfig.controller.js';

const router: Router = Router();

router.get('/:clientId', WidgetConfigController.loadConfig);

export const widgetConfigRoutes = router;
