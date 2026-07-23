import { Response, NextFunction } from 'express';
import { NotificationService } from './notification.service';
import { AuthRequest } from '../../middleware/auth';

export class NotificationController {
  static async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await NotificationService.list(req.user!.id, req.query as any);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const notification = await NotificationService.markAsRead(req.params.id);
      res.json({ success: true, data: notification });
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await NotificationService.markAllAsRead(req.user!.id);
      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await NotificationService.delete(req.params.id);
      res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
      next(error);
    }
  }

  static async getUnreadCount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const count = await NotificationService.getUnreadCount(req.user!.id);
      res.json({ success: true, data: { count } });
    } catch (error) {
      next(error);
    }
  }
}
