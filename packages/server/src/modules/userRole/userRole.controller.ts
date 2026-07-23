import { Response, NextFunction } from 'express';
import { UserRoleService } from './userRole.service.js';
import { AuthRequest } from '../../middleware/auth.js';

export class UserRoleController {
  static async assign(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userRole = await UserRoleService.assign({
        ...req.body,
        assignedBy: req.user?.id,
      });
      res.status(201).json({ success: true, data: userRole });
    } catch (error) {
      next(error);
    }
  }

  static async getByUserAndClient(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userRole = await UserRoleService.getByUserAndClient(
        req.params.userId,
        req.params.clientId
      );
      res.json({ success: true, data: userRole });
    } catch (error) {
      next(error);
    }
  }

  static async getByClient(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userRoles = await UserRoleService.getByClient(req.params.clientId);
      res.json({ success: true, data: userRoles });
    } catch (error) {
      next(error);
    }
  }

  static async getByUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userRoles = await UserRoleService.getByUser(req.params.userId);
      res.json({ success: true, data: userRoles });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userRole = await UserRoleService.update(req.params.id, req.body);
      res.json({ success: true, data: userRole });
    } catch (error) {
      next(error);
    }
  }

  static async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await UserRoleService.remove(req.params.id);
      res.json({ success: true, message: 'User role removed successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async removeByUserAndClient(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await UserRoleService.removeByUserAndClient(
        req.params.userId,
        req.params.clientId
      );
      res.json({ success: true, message: 'User role removed successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async checkPermission(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId, clientId, resource, action } = req.query;
      const hasPermission = await UserRoleService.hasPermission(
        userId as string,
        clientId as string,
        resource as string,
        action as string
      );
      res.json({ success: true, data: { hasPermission } });
    } catch (error) {
      next(error);
    }
  }
}
