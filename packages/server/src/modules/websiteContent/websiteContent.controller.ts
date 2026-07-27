import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.js';
import { WebsiteScraperService } from './websiteScraper.service.js';
import { WebsiteContentModel } from './websiteContent.model.js';
import { ApiResponseHelper } from '../../utils/apiResponse.js';

export class WebsiteContentController {
  static async syncWebsite(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { clientId } = req.params;
      const result = await WebsiteScraperService.syncWebsite(clientId);
      if (result.success) {
        ApiResponseHelper.success(res, {
          pagesScraped: result.pagesScraped,
          itemsExtracted: result.itemsExtracted,
          message: `Successfully synced ${result.itemsExtracted} items from ${result.pagesScraped} pages`,
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error || 'Failed to sync website',
        });
      }
    } catch (error) {
      next(error);
    }
  }

  static async getContent(req: Request, res: Response, next: NextFunction) {
    try {
      const { clientId } = req.params;
      const { category, contentType, page = '1', limit = '50' } = req.query;

      const filter: any = { clientId, isActive: true, isDeleted: false };
      if (category) filter.category = category;
      if (contentType) filter.contentType = contentType;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      const [items, total] = await Promise.all([
        WebsiteContentModel.find(filter)
          .sort({ priority: -1, createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        WebsiteContentModel.countDocuments(filter),
      ]);

      ApiResponseHelper.success(res, {
        items,
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const { clientId } = req.params;
      const categories = await WebsiteContentModel.distinct('category', {
        clientId,
        isActive: true,
        isDeleted: false,
      });
      ApiResponseHelper.success(res, categories);
    } catch (error) {
      next(error);
    }
  }

  static async searchContent(req: Request, res: Response, next: NextFunction) {
    try {
      const { clientId } = req.params;
      const { q, limit = '10' } = req.query;

      if (!q || (q as string).length < 2) {
        ApiResponseHelper.success(res, []);
        return;
      }

      const items = await WebsiteContentModel.find(
        {
          clientId,
          isActive: true,
          isDeleted: false,
          $text: { $search: q as string },
        },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(parseInt(limit as string, 10))
        .lean();

      ApiResponseHelper.success(res, items);
    } catch (error) {
      next(error);
    }
  }
}
