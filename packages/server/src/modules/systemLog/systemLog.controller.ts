import { Request, Response } from 'express';
import { logger } from './logger.service.js';

export class SystemLogController {
  async getLogs(req: Request, res: Response) {
    try {
      const { level, category, startDate, endDate, search, page, limit } = req.query;

      const filters: any = {};
      if (level) filters.level = level;
      if (category) filters.category = category;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (search) filters.search = search as string;
      if (page) filters.page = parseInt(page as string);
      if (limit) filters.limit = parseInt(limit as string);

      const result = await logger.getLogs(filters);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get logs',
      });
    }
  }

  async getLogStats(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'startDate and endDate are required',
        });
      }

      const stats = await logger.getLogStats(
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get log stats',
      });
    }
  }

  async cleanupLogs(req: Request, res: Response) {
    try {
      const daysToKeep = parseInt(req.body.daysToKeep) || 30;

      const deletedCount = await logger.cleanup(daysToKeep);

      res.json({
        success: true,
        data: {
          deletedCount,
          message: `Cleaned up logs older than ${daysToKeep} days`,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cleanup logs',
      });
    }
  }
}

export const systemLogController = new SystemLogController();
