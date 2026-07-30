import { Response, NextFunction } from 'express';
import { UserService } from './user.service.js';
import { AuthRequest } from '../../middleware/auth.js';
import { AuditLogService } from '../auditLog/auditLog.service.js';
import { logger } from '../systemLog/logger.service.js';

export class UserController {
  static async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await UserService.list(req.query as any);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await UserService.getById(req.params.id);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await UserService.create(req.body);
      AuditLogService.logActionFromReq(req, 'create', 'user', user.id, { email: user.email, role: user.role }).catch(() => {});
      logger.info('auth', `User created: ${user.email}`, { userId: user.id, role: user.role }).catch(() => {});
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await UserService.update(req.params.id, req.body);
      AuditLogService.logActionFromReq(req, 'update', 'user', req.params.id, { email: user.email }).catch(() => {});
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await UserService.delete(req.params.id);
      AuditLogService.logActionFromReq(req, 'delete', 'user', req.params.id).catch(() => {});
      res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await UserService.getStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
}
