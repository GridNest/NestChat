import { Request, Response, NextFunction } from 'express';
import { TranslationService } from './translation.service.js';
import { ApiResponseHelper } from '../../utils/apiResponse.js';
import { AuthRequest } from '../../middleware/auth.js';

export class TranslationController {
  static async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId } = req.params;
      const { language } = req.query;
      const result = await TranslationService.getByClient(clientId, language as string);
      ApiResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async listMap(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId } = req.params;
      const result = await TranslationService.getByClientAsMap(clientId);
      ApiResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async upsert(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId } = req.params;
      const { language, key, value } = req.body;
      const result = await TranslationService.upsert(clientId, language, key, value);
      ApiResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async bulkUpsert(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId } = req.params;
      const { translations } = req.body;
      const count = await TranslationService.bulkUpsert(clientId, translations);
      ApiResponseHelper.success(res, { message: `${count} translations updated` });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId } = req.params;
      const { language, key } = req.query;
      await TranslationService.delete(clientId, language as string, key as string);
      ApiResponseHelper.success(res, { message: 'Translation deleted' });
    } catch (error) {
      next(error);
    }
  }

  static async deleteByLanguage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId, language } = req.params;
      const count = await TranslationService.deleteByLanguage(clientId, language);
      ApiResponseHelper.success(res, { message: `${count} translations deleted` });
    } catch (error) {
      next(error);
    }
  }
}