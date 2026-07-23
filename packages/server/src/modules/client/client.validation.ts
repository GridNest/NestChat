import { z } from 'zod';

export const createClientSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email format'),
    company: z.string().min(1, 'Company name is required'),
    phone: z.string().optional(),
    website: z.string().url('Invalid URL format').optional(),
    industry: z.string().optional(),
  }),
});

export const updateClientSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Client ID is required'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    company: z.string().min(1).optional(),
    phone: z.string().optional(),
    website: z.string().url('Invalid URL format').optional(),
    industry: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getClientSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Client ID is required'),
  }),
});

export const listClientsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    sort: z.enum(['name', 'company', 'createdAt']).optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }),
});
