import { Request, Response, NextFunction } from 'express';
import { ClientService } from './client.service';
import { ApiResponseHelper } from '../../utils/apiResponse';
import { AuthRequest } from '../../middleware/auth';

export class ClientController {
  static async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        ApiResponseHelper.unauthorized(res);
        return;
      }
      const result = await ClientService.create(req.body, req.user.id);
      ApiResponseHelper.created(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ClientService.getById(req.params.id);
      ApiResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ClientService.update(req.params.id, req.body);
      ApiResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await ClientService.delete(req.params.id);
      ApiResponseHelper.success(res, { message: 'Client deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ClientService.list(req.query as any);
      ApiResponseHelper.paginated(
        res,
        result.clients,
        result.page,
        result.limit,
        result.total
      );
    } catch (error) {
      next(error);
    }
  }

  static async getMyClient(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.clientId) {
        ApiResponseHelper.notFound(res, 'No client associated with this user');
        return;
      }
      const result = await ClientService.getById(req.user.clientId);
      ApiResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }
}
