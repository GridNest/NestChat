import { Request, Response, NextFunction } from 'express';
import { RoleService } from './role.service.js';

export class RoleController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const role = await RoleService.create(req.body);
      res.status(201).json({ success: true, data: role });
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const roles = await RoleService.list();
      res.json({ success: true, data: roles });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const role = await RoleService.getById(req.params.id);
      res.json({ success: true, data: role });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const role = await RoleService.update(req.params.id, req.body);
      res.json({ success: true, data: role });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await RoleService.delete(req.params.id);
      res.json({ success: true, message: 'Role deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
