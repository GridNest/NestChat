import { Router } from 'express';
import { ChatController } from './chat.controller';
import { validate } from '../../middleware/validate';
import { chatLimiter } from '../../middleware/rateLimiter';
import {
  startChatSchema,
  sendMessageSchema,
  getChatHistorySchema,
  endChatSchema,
} from './chat.validation';

const router: Router = Router();

router.post(
  '/start',
  chatLimiter,
  validate(startChatSchema),
  ChatController.startChat
);

router.post(
  '/message',
  chatLimiter,
  validate(sendMessageSchema),
  ChatController.sendMessage
);

router.get(
  '/:sessionId',
  validate(getChatHistorySchema),
  ChatController.getHistory
);

router.get(
  '/session/:sessionId',
  ChatController.getSession
);

router.post(
  '/:sessionId/end',
  validate(endChatSchema),
  ChatController.endChat
);

export const chatRoutes = router;
