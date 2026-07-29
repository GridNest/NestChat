import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';

export type AuthRequest<
  P = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any
> = Request<P, ResBody, ReqBody, ReqQuery> & {
  user?: {
    id: string;
    email: string;
    role: 'admin' | 'client' | 'agent';
    clientId?: string;
  };
  body: ReqBody;
  params: P;
  query: ReqQuery;
};

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('No token provided');
    }

    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      id: string;
      email: string;
      role: 'admin' | 'client' | 'agent';
      clientId?: string;
    };

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(ApiError.unauthorized('Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(ApiError.unauthorized('Token expired'));
    } else {
      next(error);
    }
  }
}

export function authorize(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized('Not authenticated'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(ApiError.forbidden('Insufficient permissions'));
      return;
    }

    next();
  };
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      id: string;
      email: string;
      role: 'admin' | 'client' | 'agent';
      clientId?: string;
    };

    req.user = decoded;
    next();
  } catch (error) {
    next();
  }
}

export function enforceTenantIsolation(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    next(ApiError.unauthorized('Not authenticated'));
    return;
  }

  // Super Admin can access any tenant
  if (req.user.role === 'admin') {
    next();
    return;
  }

  const userClientId = req.user.clientId;
  if (!userClientId) {
    next(ApiError.forbidden('Tenant isolation error: No client assigned to user'));
    return;
  }

  // Validate target clientId if specified in request
  const targetClientId = req.params.clientId || req.query.clientId || req.body?.clientId;

  if (targetClientId && targetClientId !== userClientId && targetClientId !== 'all') {
    next(ApiError.forbidden('Tenant isolation error: Cannot access another client data'));
    return;
  }

  // Auto-scope query and params to user's assigned clientId
  if (req.query) req.query.clientId = userClientId;
  if (req.params && req.params.clientId) req.params.clientId = userClientId;

  next();
}
