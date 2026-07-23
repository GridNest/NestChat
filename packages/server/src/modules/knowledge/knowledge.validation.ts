import { z } from 'zod';

export const createKnowledgeSchema = z.object({
  body: z.object({
    clientId: z.string().min(1, 'Client ID is required'),
    pageName: z.string().min(1, 'Page name is required').max(100),
    title: z.string().min(1, 'Title is required').max(200),
    content: z.string().min(1, 'Content is required'),
    metaDescription: z.string().max(500).optional(),
    tags: z.array(z.string()).optional().default([]),
    category: z.string().max(50).optional().default('general'),
    language: z.enum(['en', 'hi', 'both']).optional().default('en'),
    priority: z.number().int().min(0).max(100).optional().default(0),
  }),
});

export const updateKnowledgeSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Knowledge ID is required'),
  }),
  body: z.object({
    pageName: z.string().min(1).max(100).optional(),
    title: z.string().min(1).max(200).optional(),
    content: z.string().min(1).optional(),
    metaDescription: z.string().max(500).optional(),
    tags: z.array(z.string()).optional(),
    category: z.string().max(50).optional(),
    language: z.enum(['en', 'hi', 'both']).optional(),
    priority: z.number().int().min(0).max(100).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getKnowledgeSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Knowledge ID is required'),
  }),
});

export const listKnowledgeSchema = z.object({
  params: z.object({
    clientId: z.string().min(1, 'Client ID is required'),
  }),
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    sort: z.enum(['title', 'pageName', 'priority', 'createdAt', 'updatedAt']).optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }),
});

export const searchKnowledgeSchema = z.object({
  params: z.object({
    clientId: z.string().min(1, 'Client ID is required'),
  }),
  query: z.object({
    q: z.string().optional(),
    language: z.enum(['en', 'hi', 'both']).optional(),
  }),
});
