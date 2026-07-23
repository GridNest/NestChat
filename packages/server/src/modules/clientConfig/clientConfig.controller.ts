import { Request, Response, NextFunction } from 'express';
import { ClientConfigService } from './clientConfig.service.js';

export class ClientConfigController {
  static async getByClientId(req: Request, res: Response, next: NextFunction) {
    try {
      const config = await ClientConfigService.getByClientId(req.params.clientId);
      res.json({ success: true, data: config });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const config = await ClientConfigService.update(req.params.clientId, req.body);
      res.json({ success: true, data: config });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await ClientConfigService.delete(req.params.clientId);
      res.json({ success: true, message: 'Client config deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
