import { z } from 'zod';

export const startChatSchema = z.object({
  body: z.object({
    clientId: z.string().min(1, 'Client ID is required'),
    sessionId: z.string().min(1, 'Session ID is required'),
    visitorId: z.string().min(1, 'Visitor ID is required'),
    language: z.enum(['en', 'hi']).optional().default('en'),
    visitorInfo: z.object({
      userAgent: z.string().optional(),
      referrer: z.string().optional(),
      url: z.string().optional(),
    }).optional(),
  }),
});

export const sendMessageSchema = z.object({
  body: z.object({
    chatId: z.string().min(1, 'Chat ID is required'),
    sessionId: z.string().min(1, 'Session ID is required'),
    clientId: z.string().min(1, 'Client ID is required'),
    content: z.string().min(1, 'Message content is required').max(5000),
    language: z.enum(['en', 'hi']).optional(),
  }),
});

export const getChatHistorySchema = z.object({
  params: z.object({
    sessionId: z.string().min(1, 'Session ID is required'),
  }),
  query: z.object({
    clientId: z.string().optional(),
  }),
});

export const endChatSchema = z.object({
  params: z.object({
    sessionId: z.string().min(1, 'Session ID is required'),
  }),
});
