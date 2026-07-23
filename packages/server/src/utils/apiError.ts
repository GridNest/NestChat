export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: Array<{ field: string; message: string }>;

  constructor(
    statusCode: number,
    message: string,
    code: string = 'ERROR',
    details?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'ApiError';
  }

  static badRequest(message: string, details?: Array<{ field: string; message: string }>) {
    return new ApiError(400, message, 'BAD_REQUEST', details);
  }

  static unauthorized(message: string = 'Unauthorized') {
    return new ApiError(401, message, 'UNAUTHORIZED');
  }

  static forbidden(message: string = 'Forbidden') {
    return new ApiError(403, message, 'FORBIDDEN');
  }

  static notFound(message: string = 'Resource not found') {
    return new ApiError(404, message, 'NOT_FOUND');
  }

  static conflict(message: string) {
    return new ApiError(409, message, 'CONFLICT');
  }

  static validation(message: string, details: Array<{ field: string; message: string }>) {
    return new ApiError(422, message, 'VALIDATION_ERROR', details);
  }

  static rateLimited(retryAfter: number) {
    const error = new ApiError(429, 'Too many requests', 'RATE_LIMIT_EXCEEDED');
    (error as any).retryAfter = retryAfter;
    return error;
  }

  static internal(message: string = 'Internal server error') {
    return new ApiError(500, message, 'INTERNAL_ERROR');
  }
}
