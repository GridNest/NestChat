import { Response, NextFunction } from 'express';
import { WidgetGeneratorService } from './widgetGenerator.service';
import { AuthRequest } from '../../middleware/auth';

export class WidgetGeneratorController {
  static async generateScript(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { clientId } = req.params;
      const script = await WidgetGeneratorService.generateScript(clientId);
      res.json({ success: true, data: script });
    } catch (error) {
      next(error);
    }
  }

  static async regenerateSecretKey(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { clientId } = req.params;
      const secretKey = await WidgetGeneratorService.regenerateSecretKey(clientId);
      res.json({ success: true, data: { secretKey } });
    } catch (error) {
      next(error);
    }
  }

  static async updateWidgetSettings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { clientId } = req.params;
      const settings = await WidgetGeneratorService.updateWidgetSettings(clientId, req.body);
      res.json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  }

  static async updateAllowedDomains(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { clientId } = req.params;
      const domains = await WidgetGeneratorService.updateAllowedDomains(clientId, req.body.domains);
      res.json({ success: true, data: { domains } });
    } catch (error) {
      next(error);
    }
  }

  static async addAllowedDomain(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { clientId } = req.params;
      const { domain } = req.body;
      const domains = await WidgetGeneratorService.addAllowedDomain(clientId, domain);
      res.json({ success: true, data: { domains } });
    } catch (error) {
      next(error);
    }
  }

  static async removeAllowedDomain(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { clientId, domain } = req.params;
      const domains = await WidgetGeneratorService.removeAllowedDomain(clientId, domain);
      res.json({ success: true, data: { domains } });
    } catch (error) {
      next(error);
    }
  }

  static async getInstallationGuides(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { clientId } = req.params;
      const guides = await WidgetGeneratorService.getInstallationGuides(clientId);
      res.json({ success: true, data: guides });
    } catch (error) {
      next(error);
    }
  }

  static async getWidgetInfo(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { clientId } = req.params;
      const info = await WidgetGeneratorService.getClientWidgetInfo(clientId);
      res.json({ success: true, data: info });
    } catch (error) {
      next(error);
    }
  }
}
