import { z } from 'zod';

export const createFAQSchema = z.object({
  body: z.object({
    clientId: z.string().min(1, 'Client ID is required'),
    category: z.string().min(1, 'Category is required').max(50),
    question: z.string().min(1, 'Question is required').max(500),
    answer: z.string().min(1, 'Answer is required'),
    answerHi: z.string().max(1000).optional(),
    keywords: z.array(z.string()).optional().default([]),
    priority: z.number().int().min(0).max(100).optional().default(0),
  }),
});

export const updateFAQSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'FAQ ID is required'),
  }),
  body: z.object({
    category: z.string().min(1).max(50).optional(),
    question: z.string().min(1).max(500).optional(),
    answer: z.string().min(1).optional(),
    answerHi: z.string().max(1000).optional(),
    keywords: z.array(z.string()).optional(),
    priority: z.number().int().min(0).max(100).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getFAQSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'FAQ ID is required'),
  }),
});

export const listFAQSchema = z.object({
  params: z.object({
    clientId: z.string().min(1, 'Client ID is required'),
  }),
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    category: z.string().optional(),
    sort: z.enum(['question', 'category', 'priority', 'createdAt', 'updatedAt']).optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }),
});

export const searchFAQSchema = z.object({
  params: z.object({
    clientId: z.string().min(1, 'Client ID is required'),
  }),
  query: z.object({
    q: z.string().optional(),
  }),
});
