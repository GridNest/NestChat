import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface TokenPayload {
  id: string;
  clientId: string;
  role: string;
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}