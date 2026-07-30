import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { ApiResponseHelper } from '../../utils/apiResponse.js';
import { AuthRequest } from '../../middleware/auth.js';
import { logger } from '../systemLog/logger.service.js';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.register(req.body);
      ApiResponseHelper.created(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.login(req.body);
      const { AuditLogService } = await import('../auditLog/auditLog.service.js');
      AuditLogService.create({
        userId: result.user.id,
        clientId: result.user.clientId,
        action: 'login',
        module: 'settings',
        ipAddress: req.ip || req.socket?.remoteAddress,
        userAgent: req.headers['user-agent'],
      }).catch(() => {});
      logger.info('auth', `User login: ${result.user.email}`, { userId: result.user.id, role: result.user.role }).catch(() => {});
      ApiResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.refreshToken(req.body.refreshToken);
      ApiResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        ApiResponseHelper.unauthorized(res);
        return;
      }
      const result = await AuthService.getMe(req.user.id);
      ApiResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }
}
