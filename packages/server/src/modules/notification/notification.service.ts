import { NotificationModel } from './notification.model';

export class NotificationService {
  static async create(data: {
    userId: string;
    type: 'inquiry' | 'client' | 'api_failed' | 'system' | 'chat';
    title: string;
    message: string;
    data?: Record<string, any>;
  }) {
    return NotificationModel.create(data);
  }

  static async list(userId: string, query: { page?: number; limit?: number; unreadOnly?: boolean }) {
    const { page = 1, limit = 20, unreadOnly = false } = query;
    const skip = (page - 1) * limit;

    const filter: any = { userId };
    if (unreadOnly) filter.read = false;

    const [notifications, total, unreadCount] = await Promise.all([
      NotificationModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      NotificationModel.countDocuments(filter),
      NotificationModel.countDocuments({ userId, read: false }),
    ]);

    return { notifications, total, unreadCount, page, limit };
  }

  static async markAsRead(id: string) {
    return NotificationModel.findByIdAndUpdate(id, { read: true }, { new: true });
  }

  static async markAllAsRead(userId: string) {
    return NotificationModel.updateMany({ userId, read: false }, { read: true });
  }

  static async delete(id: string) {
    return NotificationModel.findByIdAndDelete(id);
  }

  static async getUnreadCount(userId: string) {
    return NotificationModel.countDocuments({ userId, read: false });
  }
}
