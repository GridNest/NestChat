import { Request, Response, NextFunction } from 'express';
import { WebsiteConnectorService } from './websiteConnector.service';

export class WebsiteConnectorController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const connector = await WebsiteConnectorService.create(req.body);
      res.status(201).json({ success: true, data: connector });
    } catch (error) {
      next(error);
    }
  }

  static async getByClientId(req: Request, res: Response, next: NextFunction) {
    try {
      const connector = await WebsiteConnectorService.getByClientId(req.params.clientId);
      res.json({ success: true, data: connector });
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const connectors = await WebsiteConnectorService.list();
      res.json({ success: true, data: connectors });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const connector = await WebsiteConnectorService.update(req.params.clientId, req.body);
      res.json({ success: true, data: connector });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await WebsiteConnectorService.delete(req.params.clientId);
      res.json({ success: true, message: 'Website connector deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
