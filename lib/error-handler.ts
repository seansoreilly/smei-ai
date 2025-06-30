import { NextRequest, NextResponse } from 'next/server';
import { BaseAppError } from './errors/BaseAppError';
import { logger } from './logger';

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function withErrorHandler<T extends unknown[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const correlationId = crypto.randomUUID();
    logger.setCorrelationId(correlationId);

    try {
      const response = await handler(request, ...args);
      
      // Add correlation ID to successful responses
      response.headers.set('X-Correlation-ID', correlationId);
      
      return response;
    } catch (error) {
      logger.error('Request handler error', {
        url: request.url,
        method: request.method,
        correlationId
      }, error as Error);

      // Handle known application errors
      if (error instanceof BaseAppError) {
        const errorResponse: ErrorResponse = {
          error: {
            code: error.publicCode,
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error.meta : undefined
          }
        };

        return new NextResponse(
          JSON.stringify(errorResponse),
          {
            status: error.httpStatus,
            headers: {
              'Content-Type': 'application/json',
              'X-Correlation-ID': correlationId
            }
          }
        );
      }

      // Handle unknown errors
      const errorResponse: ErrorResponse = {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: process.env.NODE_ENV === 'development' ? {
            originalError: String(error),
            stack: error instanceof Error ? error.stack : undefined
          } : undefined
        }
      };

      return new NextResponse(
        JSON.stringify(errorResponse),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'X-Correlation-ID': correlationId
          }
        }
      );
    }
  };
}

// Global error handlers for unhandled rejections and exceptions
export function setupGlobalErrorHandlers() {
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection', {
      reason: String(reason),
      promise: String(promise)
    });
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {}, error);
    // In production, you might want to exit gracefully
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });
}