import { Request, Response, NextFunction } from 'express';
import { UnansweredService } from './unanswered.service';
import { ApiResponseHelper } from '../../utils/apiResponse';
import { AuthRequest } from '../../middleware/auth';

export class UnansweredController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId } = req.params;
      const { page, limit, search } = req.query;
      const result = await UnansweredService.list(clientId, {
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        search: search as string,
      });
      ApiResponseHelper.paginated(
        res,
        result.items,
        result.page,
        result.limit,
        result.total
      );
    } catch (error) {
      next(error);
    }
  }

  static async convertToFaq(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await UnansweredService.convertToFaq(id, req.body);
      ApiResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId } = req.params;
      const result = await UnansweredService.getStats(clientId);
      ApiResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }
}
