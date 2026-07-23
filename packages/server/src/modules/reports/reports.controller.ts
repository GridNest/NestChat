import { Request, Response } from 'express';
import { reportsService } from './reports.service.js';

export class ReportsController {
  async generateReport(req: Request, res: Response) {
    try {
      const { clientId } = req.params;
      const { type, startDate, endDate } = req.query;

      if (!type || !startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'type, startDate, and endDate are required',
        });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date format',
        });
      }

      const { headers, data } = await reportsService.generateReport(
        clientId,
        type as any,
        start,
        end
      );

      const csv = reportsService.convertToCSV(headers, data);
      const filename = reportsService.generateFilename(type as string, start, end);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csv);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate report',
      });
    }
  }

  async getReportPreview(req: Request, res: Response) {
    try {
      const { clientId } = req.params;
      const { type, startDate, endDate } = req.query;

      if (!type || !startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'type, startDate, and endDate are required',
        });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      const { headers, data } = await reportsService.generateReport(
        clientId,
        type as any,
        start,
        end
      );

      res.json({
        success: true,
        data: {
          headers,
          rows: data.slice(0, 10),
          totalRows: data.length,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate report preview',
      });
    }
  }
}

export const reportsController = new ReportsController();
