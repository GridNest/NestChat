import { Response, NextFunction } from 'express';
import { ClientService } from './client.service';
import { AuthRequest } from '../../middleware/auth';

export class ClientController {
  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const client = await ClientService.create({
        ...req.body,
        createdBy: req.user?.id,
      });
      res.status(201).json({ success: true, data: client });
    } catch (error) {
      next(error);
    }
  }

  static async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await ClientService.list(req.query as any);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const client = await ClientService.getById(req.params.id);
      res.json({ success: true, data: client });
    } catch (error) {
      next(error);
    }
  }

  static async getByClientId(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const client = await ClientService.getByClientId(req.params.clientId);
      res.json({ success: true, data: client });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const client = await ClientService.update(req.params.id, req.body);
      res.json({ success: true, data: client });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await ClientService.delete(req.params.id);
      res.json({ success: true, message: 'Client deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await ClientService.getStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
}
