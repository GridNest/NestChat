import { Request, Response, NextFunction } from 'express';
import { ChatService } from './chat.service.js';
import { ApiResponseHelper } from '../../utils/apiResponse.js';

export class ChatController {
  static async startChat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ChatService.startSession(req.body);
      ApiResponseHelper.created(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ChatService.sendMessage(req.body);
      ApiResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.params;
      const result = await ChatService.getHistory(sessionId);
      ApiResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async endChat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.params;
      await ChatService.endSession(sessionId);
      ApiResponseHelper.success(res, { message: 'Chat session ended' });
    } catch (error) {
      next(error);
    }
  }

  static async getSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.params;
      const result = await ChatService.getSession(sessionId);
      if (!result) {
        ApiResponseHelper.notFound(res, 'Chat session not found');
        return;
      }
      ApiResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }
}
