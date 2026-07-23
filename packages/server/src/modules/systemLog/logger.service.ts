import { SystemLog, ISystemLog } from './systemLog.model';

export interface LogOptions {
  level: ISystemLog['level'];
  category: ISystemLog['category'];
  message: string;
  details?: any;
  stack?: string;
  requestId?: string;
  userId?: string;
  clientId?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
}

class LoggerService {
  async log(options: LogOptions): Promise<void> {
    try {
      await SystemLog.create({
        level: options.level,
        category: options.category,
        message: options.message,
        details: options.details,
        stack: options.stack,
        requestId: options.requestId,
        userId: options.userId,
        clientId: options.clientId,
        ip: options.ip,
        userAgent: options.userAgent,
        method: options.method,
        url: options.url,
        statusCode: options.statusCode,
        duration: options.duration,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('[Logger] Failed to write log:', error);
    }
  }

  async info(category: ISystemLog['category'], message: string, details?: any) {
    await this.log({ level: 'info', category, message, details });
  }

  async warn(category: ISystemLog['category'], message: string, details?: any) {
    await this.log({ level: 'warn', category, message, details });
  }

  async error(category: ISystemLog['category'], message: string, error?: any) {
    await this.log({
      level: 'error',
      category,
      message,
      details: error?.message || error,
      stack: error?.stack,
    });
  }

  async fatal(category: ISystemLog['category'], message: string, error?: any) {
    await this.log({
      level: 'fatal',
      category,
      message,
      details: error?.message || error,
      stack: error?.stack,
    });
  }

  async apiError(req: any, res: any, message: string, error?: any) {
    await this.log({
      level: 'error',
      category: 'api',
      message,
      details: error?.message || error,
      stack: error?.stack,
      ip: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers?.['user-agent'],
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
    });
  }

  async securityEvent(message: string, details?: any) {
    await this.log({
      level: 'warn',
      category: 'security',
      message,
      details,
    });
  }

  async widgetError(clientId: string, message: string, details?: any) {
    await this.log({
      level: 'error',
      category: 'widget',
      message,
      clientId,
      details,
    });
  }

  async getLogs(filters: {
    level?: string;
    category?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const query: any = {};

    if (filters.level) query.level = filters.level;
    if (filters.category) query.category = filters.category;
    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = filters.startDate;
      if (filters.endDate) query.timestamp.$lte = filters.endDate;
    }
    if (filters.search) {
      query.$or = [
        { message: { $regex: filters.search, $options: 'i' } },
        { details: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      SystemLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SystemLog.countDocuments(query),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getLogStats(startDate: Date, endDate: Date) {
    const stats = await SystemLog.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { level: '$level', category: '$category' },
          count: { $sum: 1 },
        },
      },
    ]);

    return stats;
  }

  async cleanup(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await SystemLog.deleteMany({
      timestamp: { $lt: cutoffDate },
      level: { $nin: ['fatal', 'error'] },
    });

    return result.deletedCount || 0;
  }
}

export const logger = new LoggerService();
