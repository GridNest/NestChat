import { Router } from 'express';
import { UnansweredController } from './unanswered.controller';
import { validate } from '../../middleware/validate';
import { authenticate, authorize } from '../../middleware/auth';
import { z } from 'zod';

const router: Router = Router();

const convertToFaqSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'ID is required'),
  }),
  body: z.object({
    category: z.string().min(1, 'Category is required').max(50),
    answer: z.string().min(1, 'Answer is required'),
    answerHi: z.string().max(1000).optional(),
    keywords: z.array(z.string()).min(1, 'At least one keyword is required'),
  }),
});

router.use(authenticate);

router.get(
  '/stats/:clientId',
  UnansweredController.getStats
);

router.get(
  '/:clientId',
  UnansweredController.list
);

router.post(
  '/:id/convert',
  authorize('admin'),
  validate(convertToFaqSchema),
  UnansweredController.convertToFaq
);

export const unansweredRoutes = router;
