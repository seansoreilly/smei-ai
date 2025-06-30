import { NextRequest, NextResponse } from 'next/server';
import type { ValidationResult } from './schemas';

export type ValidatedHandler<T> = (
  request: NextRequest,
  data: T,
  context?: unknown
) => Promise<NextResponse> | NextResponse;

export function withValidation<T>(
  validator: (data: unknown) => ValidationResult<T>,
  handler: ValidatedHandler<T>
) {
  return async (request: NextRequest, context?: unknown): Promise<NextResponse> => {
    try {
      // Parse request body
      let requestData: unknown;
      
      const contentType = request.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        try {
          requestData = await request.json();
        } catch {
          return new NextResponse(
            JSON.stringify({
              error: 'Invalid JSON',
              details: 'Request body must be valid JSON'
            }),
            { 
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
      } else if (contentType?.includes('application/x-www-form-urlencoded')) {
        const formData = await request.formData();
        requestData = Object.fromEntries(formData.entries());
      } else {
        // For GET requests or other methods, use URL parameters
        const url = new URL(request.url);
        requestData = Object.fromEntries(url.searchParams.entries());
      }

      // Validate the data
      const validationResult = validator(requestData);
      
      if (!validationResult.success) {
        return new NextResponse(
          JSON.stringify({
            error: 'Validation failed',
            details: validationResult.error?.issues || 'Invalid input data'
          }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Call the handler with validated data
      return await handler(request, validationResult.data!, context);
      
    } catch (error) {
      console.error('Validation middleware error:', error);
      
      return new NextResponse(
        JSON.stringify({
          error: 'Internal server error',
          details: process.env.NODE_ENV === 'development' ? String(error) : 'An unexpected error occurred'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  };
}

export function withParamValidation<T>(
  validator: (data: unknown) => ValidationResult<T>,
  handler: ValidatedHandler<T>
) {
  return async (
    request: NextRequest, 
    { params }: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> => {
    try {
      const resolvedParams = await params;
      
      // Validate the parameters
      const validationResult = validator(resolvedParams);
      
      if (!validationResult.success) {
        return new NextResponse(
          JSON.stringify({
            error: 'Invalid parameters',
            details: validationResult.error?.issues || 'Invalid URL parameters'
          }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Call the handler with validated parameters
      return await handler(request, validationResult.data!, { params: resolvedParams });
      
    } catch (error) {
      console.error('Parameter validation error:', error);
      
      return new NextResponse(
        JSON.stringify({
          error: 'Internal server error',
          details: process.env.NODE_ENV === 'development' ? String(error) : 'An unexpected error occurred'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  };
}

// Utility function to combine body and parameter validation
export function withFullValidation<TBody, TParams>(
  bodyValidator: (data: unknown) => ValidationResult<TBody>,
  paramValidator: (data: unknown) => ValidationResult<TParams>,
  handler: (
    request: NextRequest,
    data: { body: TBody; params: TParams }
  ) => Promise<NextResponse> | NextResponse
) {
  return async (
    request: NextRequest,
    { params }: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> => {
    try {
      // Validate parameters
      const resolvedParams = await params;
      const paramValidation = paramValidator(resolvedParams);
      
      if (!paramValidation.success) {
        return new NextResponse(
          JSON.stringify({
            error: 'Invalid parameters',
            details: paramValidation.error?.issues || 'Invalid URL parameters'
          }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Validate body
      let requestData: unknown;
      try {
        requestData = await request.json();
      } catch {
        return new NextResponse(
          JSON.stringify({
            error: 'Invalid JSON',
            details: 'Request body must be valid JSON'
          }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      const bodyValidation = bodyValidator(requestData);
      
      if (!bodyValidation.success) {
        return new NextResponse(
          JSON.stringify({
            error: 'Validation failed',
            details: bodyValidation.error?.issues || 'Invalid request body'
          }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Call handler with both validated data
      return await handler(request, {
        body: bodyValidation.data!,
        params: paramValidation.data!
      });
      
    } catch (error) {
      console.error('Full validation error:', error);
      
      return new NextResponse(
        JSON.stringify({
          error: 'Internal server error',
          details: process.env.NODE_ENV === 'development' ? String(error) : 'An unexpected error occurred'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  };
}