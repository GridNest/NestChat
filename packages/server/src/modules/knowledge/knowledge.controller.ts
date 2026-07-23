import { Request, Response, NextFunction } from 'express';
import { KnowledgeService } from './knowledge.service';
import { ApiResponseHelper } from '../../utils/apiResponse';
import { AuthRequest } from '../../middleware/auth';

export class KnowledgeController {
  static async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await KnowledgeService.create(req.body, req.user?.id);
      ApiResponseHelper.created(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await KnowledgeService.getById(req.params.id);
      ApiResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await KnowledgeService.update(req.params.id, req.body, req.user?.id);
      ApiResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await KnowledgeService.delete(req.params.id);
      ApiResponseHelper.success(res, { message: 'Knowledge entry deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId } = req.params;
      const result = await KnowledgeService.list(clientId, req.query as any);
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

  static async listAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId } = req.params;
      const result = await KnowledgeService.getAllActive(clientId);
      ApiResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId } = req.params;
      const { q, language } = req.query;
      const result = await KnowledgeService.search(clientId, q as string, language as string);
      ApiResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId, slug } = req.params;
      const result = await KnowledgeService.getBySlug(clientId, slug);
      if (!result) {
        ApiResponseHelper.notFound(res, 'Knowledge entry not found');
        return;
      }
      ApiResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }
}
