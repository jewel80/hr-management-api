export interface AppErrorOptions {
  code?: string;
  fields?: Record<string, string>;
  details?: unknown;
}

/**
 * Application-level error carrying an HTTP status code and structured details.
 * The centralized error middleware renders these (and unknown errors) into the
 * standard error envelope.
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly fields?: Record<string, string>;
  public readonly details?: unknown;

  constructor(
    public readonly statusCode: number,
    message: string,
    options: AppErrorOptions = {},
  ) {
    super(message);
    this.name = 'AppError';
    this.code = options.code ?? 'ERROR';
    this.fields = options.fields;
    this.details = options.details;
  }
}

export const badRequest = (message: string, fields?: Record<string, string>): AppError =>
  new AppError(400, message, { code: 'BAD_REQUEST', fields });

export const unauthorized = (message = 'Unauthorized.'): AppError =>
  new AppError(401, message, { code: 'UNAUTHORIZED' });

export const notFound = (message: string): AppError =>
  new AppError(404, message, { code: 'NOT_FOUND' });
