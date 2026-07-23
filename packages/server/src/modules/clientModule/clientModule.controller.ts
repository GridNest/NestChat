import { Request, Response, NextFunction } from 'express';
import { ClientModuleService } from './clientModule.service.js';

export class ClientModuleController {
  static async getByClientId(req: Request, res: Response, next: NextFunction) {
    try {
      const modules = await ClientModuleService.getByClientId(req.params.clientId);
      res.json({ success: true, data: modules });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const modules = await ClientModuleService.update(req.params.clientId, req.body);
      res.json({ success: true, data: modules });
    } catch (error) {
      next(error);
    }
  }

  static async toggleModule(req: Request, res: Response, next: NextFunction) {
    try {
      const module = await ClientModuleService.toggleModule(
        req.params.clientId,
        req.params.moduleName,
        req.body.enabled
      );
      res.json({ success: true, data: module });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await ClientModuleService.delete(req.params.clientId, req.params.moduleName);
      res.json({ success: true, message: 'Client module deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
