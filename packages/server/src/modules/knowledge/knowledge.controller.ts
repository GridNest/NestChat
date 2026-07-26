import { Request, Response, NextFunction } from 'express';
import { KnowledgeService } from './knowledge.service.js';
import { ApiResponseHelper } from '../../utils/apiResponse.js';
import { AuthRequest } from '../../middleware/auth.js';

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

  static async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId } = req.params;
      const result = await KnowledgeService.getCategories(clientId);
      ApiResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async bulkDelete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ids } = req.body;
      await KnowledgeService.bulkDelete(ids);
      ApiResponseHelper.success(res, { message: `${ids.length} articles deleted` });
    } catch (error) {
      next(error);
    }
  }

  static async bulkUpdateStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ids, status } = req.body;
      await KnowledgeService.bulkUpdateStatus(ids, status);
      ApiResponseHelper.success(res, { message: `${ids.length} articles updated` });
    } catch (error) {
      next(error);
    }
  }

  static async downloadTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const csv = KnowledgeService.generateCsvTemplate();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=knowledge-import-template.csv');
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }

  static async exportCsv(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId } = req.params;
      const csv = await KnowledgeService.exportToCsv(clientId, req.query as any);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=knowledge-${clientId}-${Date.now()}.csv`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }

  static async exportAllCsv(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const csv = await KnowledgeService.exportToCsv(undefined, req.query as any);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=knowledge-all-${Date.now()}.csv`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }

  static async importPreview(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { csv } = req.body;
      const preview = await KnowledgeService.importPreview(csv);
      ApiResponseHelper.success(res, preview);
    } catch (error) {
      next(error);
    }
  }

  static async importCsv(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { csv } = req.body;
      const result = await KnowledgeService.importFromCsv(csv);
      ApiResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }
}
