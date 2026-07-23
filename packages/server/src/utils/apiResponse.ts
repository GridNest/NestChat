import { Response } from 'express';
import { ApiResponse } from '@nestchat/shared';

export class ApiResponseHelper {
  static success<T>(res: Response, data: T, statusCode: number = 200): void {
    const response: ApiResponse<T> = {
      success: true,
      data,
    };
    res.status(statusCode).json(response);
  }

  static created<T>(res: Response, data: T): void {
    ApiResponseHelper.success(res, data, 201);
  }

  static paginated<T>(
    res: Response,
    data: T[],
    page: number,
    limit: number,
    total: number
  ): void {
    const response: ApiResponse<T[]> = {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
    res.status(200).json(response);
  }

  static error(
    res: Response,
    statusCode: number,
    message: string,
    code: string = 'ERROR',
    details?: Array<{ field: string; message: string }>
  ): void {
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code,
        message,
        details,
      },
    };
    res.status(statusCode).json(response);
  }

  static badRequest(res: Response, message: string, details?: Array<{ field: string; message: string }>): void {
    ApiResponseHelper.error(res, 400, message, 'BAD_REQUEST', details);
  }

  static unauthorized(res: Response, message: string = 'Unauthorized'): void {
    ApiResponseHelper.error(res, 401, message, 'UNAUTHORIZED');
  }

  static forbidden(res: Response, message: string = 'Forbidden'): void {
    ApiResponseHelper.error(res, 403, message, 'FORBIDDEN');
  }

  static notFound(res: Response, message: string = 'Resource not found'): void {
    ApiResponseHelper.error(res, 404, message, 'NOT_FOUND');
  }

  static conflict(res: Response, message: string): void {
    ApiResponseHelper.error(res, 409, message, 'CONFLICT');
  }

  static validation(res: Response, details: Array<{ field: string; message: string }>): void {
    ApiResponseHelper.error(res, 422, 'Validation failed', 'VALIDATION_ERROR', details);
  }

  static internal(res: Response, message: string = 'Internal server error'): void {
    ApiResponseHelper.error(res, 500, message, 'INTERNAL_ERROR');
  }
}
