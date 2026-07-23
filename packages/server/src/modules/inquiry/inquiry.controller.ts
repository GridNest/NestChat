import { Request, Response, NextFunction } from 'express';
import { InquiryService } from './inquiry.service.js';
import { InquiryEngine } from './inquiryEngine.js';
import { ApiResponseHelper } from '../../utils/apiResponse.js';
import { AuthRequest } from '../../middleware/auth.js';

export class InquiryController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await InquiryService.create(req.body);
      ApiResponseHelper.created(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async startInquiry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { chatId, sessionId, clientId, visitorId, language } = req.body;

      const state = await InquiryEngine.createState({
        chatId,
        sessionId,
        clientId,
        visitorId,
        language,
      });

      const firstQuestion = await InquiryEngine.getFirstQuestion(chatId);

      ApiResponseHelper.created(res, {
        stateId: state._id,
        firstQuestion,
        currentStep: state.currentStep,
      });
    } catch (error) {
      next(error);
    }
  }

  static async processMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { chatId, input } = req.body;

      const result = await InquiryEngine.processInput(chatId, input);

      ApiResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async cancelInquiry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { chatId } = req.body;

      const state = await InquiryEngine.getState(chatId);
      if (!state) {
        ApiResponseHelper.notFound(res, 'No active inquiry found');
        return;
      }

      const result = await InquiryEngine.cancelInquiry(state);
      ApiResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getState(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { chatId } = req.params;
      const state = await InquiryEngine.getState(chatId);
      if (!state) {
        ApiResponseHelper.notFound(res, 'No active inquiry found');
        return;
      }
      ApiResponseHelper.success(res, state);
    } catch (error) {
      next(error);
    }
  }

  static async getProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { chatId } = req.params;
      const progress = await InquiryEngine.getProgress(chatId);
      if (!progress) {
        ApiResponseHelper.notFound(res, 'No active inquiry found');
        return;
      }
      ApiResponseHelper.success(res, progress);
    } catch (error) {
      next(error);
    }
  }

  static async getServiceOptions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const options = InquiryEngine.getServiceOptions();
      ApiResponseHelper.success(res, options);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await InquiryService.getById(req.params.id);
      ApiResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await InquiryService.update(req.params.id, req.body);
      ApiResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId } = req.params;
      const result = await InquiryService.list(clientId, req.query as any);
      ApiResponseHelper.paginated(
        res,
        result.items,
        result.page,
        result.limit,
        result.total
      );
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId } = req.params;
      const result = await InquiryService.getStats(clientId);
      ApiResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async retryForward(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await InquiryService.retryForward(req.params.id);
      ApiResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }
}
