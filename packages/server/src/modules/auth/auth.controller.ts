import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { ApiResponseHelper } from '../../utils/apiResponse.js';
import { AuthRequest } from '../../middleware/auth.js';

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
