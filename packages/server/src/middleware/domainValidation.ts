import { Request, Response, NextFunction } from 'express';
import { ClientModel } from '../modules/client/client.model.js';

const DEV_MODE = process.env.NODE_ENV !== 'production';
const DEV_DOMAINS = ['localhost', '127.0.0.1', '::1', '::ffff:127.0.0.1'];

export async function validateDomain(req: Request, res: Response, next: NextFunction) {
  try {
    const origin = req.headers.origin || req.headers.referer;
    const clientId = req.params.clientId || req.body.clientId || req.query.clientId;

    if (!origin) {
      return next();
    }

    let requestDomain: string;
    try {
      const url = new URL(origin);
      requestDomain = url.hostname;
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid origin' });
    }

    if (DEV_MODE && DEV_DOMAINS.includes(requestDomain)) {
      return next();
    }

    if (!clientId) {
      return res.status(400).json({ success: false, error: 'Client ID required for domain validation' });
    }

    const client = await ClientModel.findOne({ clientId: clientId as string, isActive: true });
    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    if (!client.allowedDomains || client.allowedDomains.length === 0) {
      return next();
    }

    const isAllowed = client.allowedDomains.some(
      (domain: string) => domain === requestDomain || requestDomain.endsWith(`.${domain}`)
    );

    if (!isAllowed) {
      return res.status(403).json({ 
        success: false, 
        error: 'Domain not allowed',
        domain: requestDomain 
      });
    }

    next();
  } catch (error) {
    next(error);
  }
}

export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;
  
  if (DEV_MODE) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Client-ID');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
}
