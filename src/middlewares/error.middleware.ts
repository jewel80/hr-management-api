import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { AppError } from '../errors/AppError';
import { logger } from '../utils/logger';

interface ErrorEnvelope {
  success: false;
  statusCode: number;
  timestamp: string;
  path: string;
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
    details?: unknown;
  };
}

const build = (
  req: Request,
  statusCode: number,
  code: string,
  message: string,
  fields?: Record<string, string>,
  details?: unknown,
): ErrorEnvelope => ({
  success: false,
  statusCode,
  timestamp: new Date().toISOString(),
  path: req.originalUrl,
  error: { code, message, fields, details },
});

/**
 * Centralized Express error handler. Renders every error (AppError, multer
 * errors, or unexpected errors) into the standard error envelope and never
 * leaks internal details for unexpected failures.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(`${req.method} ${req.originalUrl} -> ${err.statusCode}`, err.stack);
    } else {
      logger.warn(`${req.method} ${req.originalUrl} -> ${err.statusCode} ${err.message}`);
    }
    res
      .status(err.statusCode)
      .json(build(req, err.statusCode, err.code, err.message, err.fields, err.details));
    return;
  }

  if (err instanceof multer.MulterError) {
    const tooLarge = err.code === 'LIMIT_FILE_SIZE';
    const statusCode = tooLarge ? 413 : 400;
    const message = tooLarge
      ? 'Uploaded file exceeds the maximum allowed size.'
      : `Upload error: ${err.message}`;
    logger.warn(`${req.method} ${req.originalUrl} -> ${statusCode} ${err.code}`);
    res
      .status(statusCode)
      .json(
        build(req, statusCode, tooLarge ? 'PAYLOAD_TOO_LARGE' : 'BAD_REQUEST', message),
      );
    return;
  }

  logger.error(
    `${req.method} ${req.originalUrl} -> 500`,
    err instanceof Error ? err.stack : String(err),
  );
  res
    .status(500)
    .json(
      build(
        req,
        500,
        'INTERNAL_SERVER_ERROR',
        'An unexpected error occurred. Please try again later.',
      ),
    );
};
