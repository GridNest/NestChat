import { Request, Response, NextFunction } from 'express';
import { ClientThemeService } from './clientTheme.service';

export class ClientThemeController {
  static async getByClientId(req: Request, res: Response, next: NextFunction) {
    try {
      const theme = await ClientThemeService.getByClientId(req.params.clientId);
      res.json({ success: true, data: theme });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const theme = await ClientThemeService.update(req.params.clientId, req.body);
      res.json({ success: true, data: theme });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await ClientThemeService.delete(req.params.clientId);
      res.json({ success: true, message: 'Client theme deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
