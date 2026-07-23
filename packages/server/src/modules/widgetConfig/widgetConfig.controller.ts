import { Request, Response, NextFunction } from 'express';
import { WidgetConfigService } from './widgetConfig.service';

export class WidgetConfigController {
  static async loadConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const config = await WidgetConfigService.loadConfig(req.params.clientId);
      res.json({ success: true, data: config });
    } catch (error) {
      next(error);
    }
  }
}
