import { unlink } from 'node:fs/promises';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ObjectSchema, ValidationError } from 'joi';
import { badRequest } from '../errors/AppError';

type RequestLocation = 'body' | 'query' | 'params';

export interface ValidateOptions {
  /**
   * When true, delete `req.file` if validation fails. Use on multipart routes
   * where Multer has already written an uploaded file to disk before the body
   * is validated, so a rejected request does not leave an orphan file behind.
   */
  removeFileOnError?: boolean;
}

/**
 * Builds an Express middleware that validates `req[location]` against a Joi
 * schema (with conversion + stripping of unknown keys) and replaces it with the
 * validated, typed value. Validation failures are forwarded as 400 `AppError`s.
 */
export const validate =
  <T>(
    schema: ObjectSchema<T>,
    location: RequestLocation = 'body',
    opts: ValidateOptions = {},
  ): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const { value, error } = schema.validate(req[location], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      if (opts.removeFileOnError && req.file) {
        // Best-effort cleanup: an uploaded file may already be on disk.
        void unlink(req.file.path).catch(() => {});
      }
      next(badRequest('Validation failed.', toFields(error)));
      return;
    }

    (req as unknown as Record<string, unknown>)[location] = value;
    next();
  };

const toFields = (error: ValidationError): Record<string, string> => {
  const fields: Record<string, string> = {};
  for (const detail of error.details) {
    const key = detail.path.map(String).join('.') || '_';
    fields[key] = detail.message;
  }
  return fields;
};
