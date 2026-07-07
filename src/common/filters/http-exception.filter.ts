import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { ApiErrorResponse } from '../interfaces/api-response.interface';

interface NormalizedError {
  code: string;
  message: string;
  fields?: Record<string, string>;
  details?: unknown;
}

const STATUS_CODE_TO_ERROR_CODE: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
  [HttpStatus.PAYLOAD_TOO_LARGE]: 'PAYLOAD_TOO_LARGE',
  [HttpStatus.UNSUPPORTED_MEDIA_TYPE]: 'UNSUPPORTED_MEDIA_TYPE',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_SERVER_ERROR',
};

/**
 * Global catch-all exception filter. Translates every thrown exception (Nest
 * HttpException, validation errors, or unexpected errors) into the standard
 * error envelope `{ success, statusCode, timestamp, path, error }`.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, error } = this.normalize(exception);

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} -> ${statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} -> ${statusCode} ${error.message}`,
      );
    }

    const body: ApiErrorResponse = {
      success: false,
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      error,
    };

    response.status(statusCode).json(body);
  }

  private normalize(exception: unknown): {
    statusCode: number;
    error: NormalizedError;
  } {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      return {
        statusCode,
        error: this.fromResponse(exception.getResponse(), statusCode),
      };
    }

    // Unexpected programming/runtime error: never leak internals to clients.
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred. Please try again later.',
        details: exception instanceof Error ? exception.message : undefined,
      },
    };
  }

  private fromResponse(response: unknown, statusCode: number): NormalizedError {
    const fallbackCode = STATUS_CODE_TO_ERROR_CODE[statusCode] ?? 'ERROR';

    if (typeof response === 'string') {
      return { code: fallbackCode, message: response };
    }

    const obj = (response ?? {}) as Record<string, unknown>;

    const code =
      typeof obj.error === 'string'
        ? obj.error.toUpperCase().replace(/\s+/g, '_')
        : fallbackCode;

    // class-validator ValidationPipe failures surface as string[] on `message`.
    if (Array.isArray(obj.message)) {
      const messages = (obj.message as unknown[]).map((m) => String(m));
      return {
        code: fallbackCode,
        message: messages.join('; '),
        fields: this.toFields(messages),
      };
    }

    const message =
      typeof obj.message === 'string'
        ? obj.message
        : typeof obj.error === 'string'
          ? obj.error
          : 'Request failed';

    return { code, message };
  }

  /** Best-effort grouping of validation messages by offending property. */
  private toFields(messages: string[]): Record<string, string> | undefined {
    const fields: Record<string, string> = {};

    for (const message of messages) {
      const match = /^(?:property\s+)?([A-Za-z0-9_.\[\]]+)/.exec(message) ?? null;
      const key = match?.[1];
      if (key) {
        fields[key] = message;
      } else {
        // Keep the message reachable even when no property token is found.
        fields[message] = message;
      }
    }

    return Object.keys(fields).length > 0 ? fields : undefined;
  }
}
