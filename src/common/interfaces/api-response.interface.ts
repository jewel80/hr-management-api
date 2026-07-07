/**
 * Consistent JSON envelope applied to every successful API response by the
 * global {@link ResponseInterceptor}.
 */
export interface ApiResponse<T> {
  success: true;
  statusCode: number;
  timestamp: string;
  data: T;
}

/**
 * Consistent JSON envelope applied to every error response by the global
 * {@link HttpExceptionFilter}.
 */
export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  timestamp: string;
  path: string;
  error: {
    code: string;
    message: string;
    /** Field-level validation messages keyed by property path, if any */
    fields?: Record<string, string>;
    /** Optional extra context (e.g. raw cause for unexpected errors) */
    details?: unknown;
  };
}
