import { Router } from 'express';
import { ClientFormController } from './clientForm.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router: Router = Router();

// Protect client form management routes with authentication
router.use(authenticate);

router.get('/:clientId', ClientFormController.getForms);
router.post('/:clientId/scan', ClientFormController.scanForms);
router.get('/:clientId/:formId', ClientFormController.getFormById);
router.put('/:clientId/:formId', ClientFormController.updateForm);
router.delete('/:clientId/:formId', ClientFormController.deleteForm);
router.post('/:clientId/:formId/test', ClientFormController.testFormSubmission);

export const clientFormRoutes = router;
