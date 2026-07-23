import { Request, Response, NextFunction } from 'express';
import { WidgetConfigService } from '../widgetConfig/widgetConfig.service';
import { FAQService } from '../faq/faq.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { ApiResponseHelper } from '../../utils/apiResponse';

export class WidgetController {
  static async getConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId } = req.params;
      const result = await WidgetConfigService.loadConfig(clientId);
      ApiResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getFAQs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId } = req.params;
      const result = await FAQService.getAllActive(clientId);
      ApiResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getKnowledge(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId } = req.params;
      const result = await KnowledgeService.getAllActive(clientId);
      ApiResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getFAQCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId } = req.params;
      const result = await FAQService.getAllCategories(clientId);
      ApiResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getFAQByCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId, category } = req.params;
      const result = await FAQService.getByCategory(clientId, category);
      ApiResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async searchKnowledge(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId } = req.params;
      const { q, language } = req.query;
      const result = await KnowledgeService.search(clientId, q as string, language as string);
      ApiResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }
}
