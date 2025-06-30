// Base error class for application-specific errors

export class BaseAppError extends Error {
  public readonly publicCode: string;
  public readonly httpStatus: number;
  public readonly isOperational: boolean;
  public readonly meta?: Record<string, unknown>;
  public readonly timestamp: string;

  constructor(
    message: string,
    publicCode: string,
    httpStatus: number = 500,
    isOperational: boolean = true,
    meta?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.publicCode = publicCode;
    this.httpStatus = httpStatus;
    this.isOperational = isOperational;
    this.meta = meta;
    this.timestamp = new Date().toISOString();

    // Capture stack trace, excluding constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      publicCode: this.publicCode,
      httpStatus: this.httpStatus,
      timestamp: this.timestamp,
      meta: this.meta
    };
  }
}

// Specific error types
export class ValidationError extends BaseAppError {
  constructor(message: string, meta?: Record<string, unknown>) {
    super(message, 'VALIDATION_FAILED', 400, true, meta);
  }
}

export class AuthenticationError extends BaseAppError {
  constructor(message: string = 'Authentication required', meta?: Record<string, unknown>) {
    super(message, 'AUTHENTICATION_FAILED', 401, true, meta);
  }
}

export class AuthorizationError extends BaseAppError {
  constructor(message: string = 'Insufficient permissions', meta?: Record<string, unknown>) {
    super(message, 'AUTHORIZATION_FAILED', 403, true, meta);
  }
}

export class NotFoundError extends BaseAppError {
  constructor(message: string = 'Resource not found', meta?: Record<string, unknown>) {
    super(message, 'NOT_FOUND', 404, true, meta);
  }
}

export class RateLimitError extends BaseAppError {
  constructor(message: string = 'Too many requests', meta?: Record<string, unknown>) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, true, meta);
  }
}

export class ExternalServiceError extends BaseAppError {
  constructor(message: string, meta?: Record<string, unknown>) {
    super(message, 'EXTERNAL_SERVICE_ERROR', 502, true, meta);
  }
}

export class UnexpectedError extends BaseAppError {
  constructor(message: string = 'An unexpected error occurred', meta?: Record<string, unknown>) {
    super(message, 'INTERNAL_ERROR', 500, false, meta);
  }
}