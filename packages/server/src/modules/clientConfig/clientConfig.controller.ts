import { Request, Response, NextFunction } from 'express';
import { ClientConfigService } from './clientConfig.service';
import { ApiResponseHelper } from '../../utils/apiResponse';
import { AuthRequest } from '../../middleware/auth';

export class ClientConfigController {
  static async getByClientId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ClientConfigService.getByClientId(req.params.clientId);
      ApiResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.clientId) {
        ApiResponseHelper.unauthorized(res);
        return;
      }
      const result = await ClientConfigService.update(req.user.clientId, req.body);
      ApiResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getWidgetConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ClientConfigService.getWidgetConfig(req.params.clientId);
      ApiResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ClientConfigService.getAll();
      ApiResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }
}
