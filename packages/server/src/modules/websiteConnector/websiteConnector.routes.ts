import { Router } from 'express';
import { WebsiteConnectorController } from './websiteConnector.controller';
import { authenticate } from '../../middleware/auth';

const router: Router = Router();

router.post('/', authenticate, WebsiteConnectorController.create);
router.get('/', authenticate, WebsiteConnectorController.list);
router.get('/:clientId', authenticate, WebsiteConnectorController.getByClientId);
router.put('/:clientId', authenticate, WebsiteConnectorController.update);
router.delete('/:clientId', authenticate, WebsiteConnectorController.delete);

export const websiteConnectorRoutes = router;
