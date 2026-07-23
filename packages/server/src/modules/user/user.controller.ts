import { Response, NextFunction } from 'express';
import { UserService } from './user.service.js';
import { AuthRequest } from '../../middleware/auth.js';

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
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await UserService.update(req.params.id, req.body);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await UserService.delete(req.params.id);
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
