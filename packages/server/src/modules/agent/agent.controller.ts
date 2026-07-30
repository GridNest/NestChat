import { Request, Response, NextFunction } from 'express';
import { AgentService } from './agent.service.js';
import { ChatService } from '../chat/chat.service.js';
import { ApiResponseHelper } from '../../utils/apiResponse.js';
import { AuthRequest } from '../../middleware/auth.js';

export class AgentController {
  static async getStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id as string;
      const clientId = req.user!.clientId;
      const agent = await AgentService.getOrCreate(userId, clientId);
      ApiResponseHelper.success(res, agent);
    } catch (error) {
      next(error);
    }
  }

  static async setStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.body;
      const result = await AgentService.setStatus(req.user!.id as string, status);
      ApiResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async listByClient(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId } = req.params;
      const agents = await AgentService.getByClient(clientId);
      ApiResponseHelper.success(res, agents);
    } catch (error) {
      next(error);
    }
  }

  static async getAvailable(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId } = req.params;
      const agents = await AgentService.getAvailable(clientId);
      ApiResponseHelper.success(res, agents);
    } catch (error) {
      next(error);
    }
  }

  static async assignChat(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { chatId, userId } = req.body;
      await AgentService.assignChat(chatId, userId);
      ApiResponseHelper.success(res, { message: 'Chat assigned' });
    } catch (error) {
      next(error);
    }
  }

  static async unassignChat(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { chatId } = req.body;
      const { userId } = req.params;
      await AgentService.unassignChat(chatId, userId);
      ApiResponseHelper.success(res, { message: 'Chat unassigned' });
    } catch (error) {
      next(error);
    }
  }

  static async getAssignedChats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const chats = await AgentService.getAssignedChats(req.user!.id as string);
      ApiResponseHelper.success(res, chats);
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId } = req.params;
      const stats = await AgentService.getStats(clientId);
      ApiResponseHelper.success(res, stats);
    } catch (error) {
      next(error);
    }
  }

  static async sendAgentMessage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { chatId, content } = req.body;
      const result = await ChatService.sendAgentMessage(chatId, req.user!.id as string, content);
      ApiResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async assignSelf(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { chatId } = req.body;
      await AgentService.assignChat(chatId, req.user!.id as string);
      ApiResponseHelper.success(res, { message: 'Chat assigned to you' });
    } catch (error) {
      next(error);
    }
  }
}