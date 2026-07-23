import { Router } from 'express';
import { InquiryController } from './inquiry.controller';
import { validate } from '../../middleware/validate';
import { authenticate, authorize } from '../../middleware/auth';
import { chatLimiter, widgetLimiter } from '../../middleware/rateLimiter';
import {
  createInquirySchema,
  updateInquirySchema,
  getInquirySchema,
  listInquirySchema,
  startInquirySchema,
  inquiryMessageSchema,
} from './inquiry.validation';

const router: Router = Router();

router.post(
  '/start',
  widgetLimiter,
  validate(startInquirySchema),
  InquiryController.startInquiry
);

router.post(
  '/message',
  widgetLimiter,
  validate(inquiryMessageSchema),
  InquiryController.processMessage
);

router.post(
  '/cancel',
  widgetLimiter,
  InquiryController.cancelInquiry
);

router.get(
  '/state/:chatId',
  InquiryController.getState
);

router.get(
  '/progress/:chatId',
  InquiryController.getProgress
);

router.get(
  '/services',
  InquiryController.getServiceOptions
);

router.post(
  '/',
  widgetLimiter,
  validate(createInquirySchema),
  InquiryController.create
);

router.use(authenticate);

router.get(
  '/stats/:clientId',
  InquiryController.getStats
);

router.get(
  '/:clientId',
  validate(listInquirySchema),
  InquiryController.list
);

router.get(
  '/detail/:id',
  validate(getInquirySchema),
  InquiryController.getById
);

router.put(
  '/:id',
  authorize('admin'),
  validate(updateInquirySchema),
  InquiryController.update
);

router.post(
  '/:id/forward',
  authorize('admin'),
  InquiryController.retryForward
);

export const inquiryRoutes = router;
