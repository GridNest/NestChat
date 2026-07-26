import { Request, Response, NextFunction } from 'express';
import { FAQService } from './faq.service.js';
import { ApiResponseHelper } from '../../utils/apiResponse.js';
import { AuthRequest } from '../../middleware/auth.js';

export class FAQController {
  static async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await FAQService.create(req.body);
      ApiResponseHelper.created(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await FAQService.getById(req.params.id);
      ApiResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await FAQService.update(req.params.id, req.body);
      ApiResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await FAQService.delete(req.params.id);
      ApiResponseHelper.success(res, { message: 'FAQ deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId } = req.params;
      const result = await FAQService.list(clientId, req.query as any);
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
      const result = await FAQService.getAllActive(clientId);
      ApiResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getByCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId, category } = req.params;
      const result = await FAQService.getByCategory(clientId, category);
      ApiResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId } = req.params;
      const result = await FAQService.getAllCategories(clientId);
      ApiResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId } = req.params;
      const { q } = req.query;
      const result = await FAQService.search(clientId, q as string);
      ApiResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async bulkDelete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ids } = req.body;
      await FAQService.bulkDelete(ids);
      ApiResponseHelper.success(res, { message: `${ids.length} FAQs deleted` });
    } catch (error) {
      next(error);
    }
  }

  static async bulkUpdateStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ids, status } = req.body;
      await FAQService.bulkUpdateStatus(ids, status);
      ApiResponseHelper.success(res, { message: `${ids.length} FAQs updated to ${status}` });
    } catch (error) {
      next(error);
    }
  }

  static async downloadTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const csv = FAQService.generateCsvTemplate();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=faq-import-template.csv');
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }

  static async exportCsv(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId } = req.params;
      const csv = await FAQService.exportToCsv(clientId, req.query as any);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=faqs-${clientId}-${Date.now()}.csv`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }

  static async importPreview(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { csv } = req.body;
      const preview = await FAQService.importPreview(csv);
      ApiResponseHelper.success(res, preview);
    } catch (error) {
      next(error);
    }
  }

  static async importCsv(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { csv } = req.body;
      const result = await FAQService.importFromCsv(csv);
      ApiResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }
}
