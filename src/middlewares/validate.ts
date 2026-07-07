import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ObjectSchema, ValidationError } from 'joi';
import { badRequest } from '../errors/AppError';

type RequestLocation = 'body' | 'query' | 'params';

/**
 * Builds an Express middleware that validates `req[location]` against a Joi
 * schema (with conversion + stripping of unknown keys) and replaces it with the
 * validated, typed value. Validation failures are forwarded as 400 `AppError`s.
 */
export const validate =
  <T>(schema: ObjectSchema<T>, location: RequestLocation = 'body'): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const { value, error } = schema.validate(req[location], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
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
