import { Router } from 'express';
import { ClientController } from './client.controller';
import { validate } from '../../middleware/validate';
import { authenticate, authorize } from '../../middleware/auth';
import {
  createClientSchema,
  updateClientSchema,
  getClientSchema,
  listClientsSchema,
} from './client.validation';

const router: Router = Router();

router.use(authenticate);

router.get('/', authorize('admin'), validate(listClientsSchema), ClientController.list);
router.post('/', authorize('admin'), validate(createClientSchema), ClientController.create);
router.get('/me', ClientController.getMyClient);
router.get('/:id', validate(getClientSchema), ClientController.getById);
router.put('/:id', validate(updateClientSchema), ClientController.update);
router.delete('/:id', validate(getClientSchema), ClientController.delete);

export const clientRoutes = router;
