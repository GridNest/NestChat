import { z } from 'zod';

export const createInquirySchema = z.object({
  body: z.object({
    clientId: z.string().min(1, 'Client ID is required'),
    sessionId: z.string().optional(),
    chatId: z.string().optional(),
    visitorId: z.string().optional(),
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email format'),
    phone: z.string().min(5, 'Phone number is too short').max(20),
    country: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    service: z.string().min(1, 'Service is required').max(100),
    details: z.string().min(10, 'Please provide at least 10 characters').max(5000),
    company: z.string().max(200).optional(),
    language: z.enum(['en', 'hi']).optional().default('en'),
  }),
});

export const updateInquirySchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Inquiry ID is required'),
  }),
  body: z.object({
    status: z.enum(['new', 'contacted', 'converted', 'closed']).optional(),
    notes: z.string().optional(),
  }),
});

export const getInquirySchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Inquiry ID is required'),
  }),
});

export const listInquirySchema = z.object({
  params: z.object({
    clientId: z.string().min(1, 'Client ID is required'),
  }),
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    sort: z.enum(['name', 'email', 'service', 'status', 'createdAt', 'updatedAt']).optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }),
});

export const startInquirySchema = z.object({
  body: z.object({
    chatId: z.string().min(1, 'Chat ID is required'),
    sessionId: z.string().min(1, 'Session ID is required'),
    clientId: z.string().min(1, 'Client ID is required'),
    visitorId: z.string().min(1, 'Visitor ID is required'),
    language: z.enum(['en', 'hi']).optional().default('en'),
  }),
});

export const inquiryMessageSchema = z.object({
  body: z.object({
    chatId: z.string().min(1, 'Chat ID is required'),
    input: z.string().min(1, 'Input is required').max(5000),
  }),
});
