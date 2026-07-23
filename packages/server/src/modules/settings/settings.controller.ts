import { Request, Response, NextFunction } from 'express';
import { SettingsService } from './settings.service';

export class SettingsController {
  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await SettingsService.get();
      res.json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await SettingsService.update(req.body);
      res.json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  }
}
