import { Router } from 'express';
import { ChatController } from './chat.controller.js';
import { validate } from '../../middleware/validate.js';
import { chatLimiter } from '../../middleware/rateLimiter.js';
import {
  startChatSchema,
  sendMessageSchema,
  getChatHistorySchema,
  endChatSchema,
} from './chat.validation.js';

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
