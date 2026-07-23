import { AuditLogModel } from './auditLog.model';

export class AuditLogService {
  static async create(data: {
    userId: string;
    clientId?: string;
    action: string;
    module: string;
    resourceId?: string;
    oldValue?: any;
    newValue?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return AuditLogModel.create({
      userId: data.userId,
      clientId: data.clientId,
      action: data.action,
      module: data.module,
      resourceId: data.resourceId,
      oldValue: data.oldValue,
      newValue: data.newValue,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });
  }

  static async list(query: {
    clientId?: string;
    module?: string;
    action?: string;
    userId?: string;
    page?: number;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  }) {
    const { clientId, module, action, userId, page = 1, limit = 20, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (clientId) filter.clientId = clientId;
    if (module) filter.module = module;
    if (action) filter.action = action;
    if (userId) filter.userId = userId;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = startDate;
      if (endDate) filter.createdAt.$lte = endDate;
    }

    const [logs, total] = await Promise.all([
      AuditLogModel.find(filter)
        .populate('userId', 'name email')
        .populate('clientId', 'name companyName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AuditLogModel.countDocuments(filter),
    ]);

    return { logs, total, page, limit };
  }

  static async getById(id: string) {
    return AuditLogModel.findById(id)
      .populate('userId', 'name email')
      .populate('clientId', 'name companyName');
  }

  static async getStats(clientId?: string) {
    const filter: any = {};
    if (clientId) filter.clientId = clientId;

    const [total, today, thisWeek, thisMonth] = await Promise.all([
      AuditLogModel.countDocuments(filter),
      AuditLogModel.countDocuments({
        ...filter,
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),
      AuditLogModel.countDocuments({
        ...filter,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
      AuditLogModel.countDocuments({
        ...filter,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),
    ]);

    return { total, today, thisWeek, thisMonth };
  }
}
