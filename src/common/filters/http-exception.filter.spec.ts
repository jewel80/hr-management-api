import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

/**
 * Builds a minimal ArgumentsHost whose response captures the JSON payload that
 * the filter writes, so assertions can inspect the emitted error envelope.
 */
const buildHost = (
  method = 'GET',
  url = '/employees',
): { host: ArgumentsHost; getStatus: () => number; getBody: () => unknown } => {
  let capturedStatus = 0;
  let capturedBody: unknown = undefined;

  const json = (body: unknown): void => {
    capturedBody = body;
  };
  const status = (code: number): { json: typeof json } => {
    capturedStatus = code;
    return { json };
  };

  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({ method, url }),
    }),
  } as unknown as ArgumentsHost;

  return {
    host,
    getStatus: () => capturedStatus,
    getBody: () => capturedBody,
  };
};

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
  });

  it('maps a NotFoundException (string message) to a 404 envelope', () => {
    const { host, getStatus, getBody } = buildHost();
    filter.catch(new HttpException('Employee not found', HttpStatus.NOT_FOUND), host);

    const body = getBody() as Record<string, unknown>;
    expect(getStatus()).toBe(404);
    expect(body.success).toBe(false);
    expect(body.statusCode).toBe(404);
    expect(body.path).toBe('/employees');
    expect((body.error as Record<string, unknown>).code).toBe('NOT_FOUND');
    expect((body.error as Record<string, unknown>).message).toBe('Employee not found');
  });

  it('groups class-validator array messages into fields on 400', () => {
    const { host, getStatus, getBody } = buildHost();
    filter.catch(
      new HttpException(
        {
          statusCode: 400,
          error: 'Bad Request',
          message: ['name must be a string', 'age must be an integer number'],
        },
        HttpStatus.BAD_REQUEST,
      ),
      host,
    );

    const body = getBody() as Record<string, unknown>;
    const error = body.error as Record<string, unknown>;
    expect(getStatus()).toBe(400);
    expect(error.code).toBe('BAD_REQUEST');
    expect(error.message).toBe('name must be a string; age must be an integer number');
    expect(error.fields).toEqual({
      name: 'name must be a string',
      age: 'age must be an integer number',
    });
  });

  it('masks unexpected errors as a generic 500 without leaking internals', () => {
    const { host, getStatus, getBody } = buildHost();
    filter.catch(new Error('synthetic-test-boom'), host);

    const body = getBody() as Record<string, unknown>;
    const error = body.error as Record<string, unknown>;
    expect(getStatus()).toBe(500);
    expect(error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(error.message).toBe('An unexpected error occurred. Please try again later.');
    // The original message is not exposed to the client in `message`.
    expect(error.message).not.toContain('synthetic-test-boom');
  });

  it('always stamps a timestamp and path', () => {
    const { host, getBody } = buildHost('POST', '/attendance');
    filter.catch(new HttpException('boom', HttpStatus.CONFLICT), host);

    const body = getBody() as Record<string, unknown>;
    expect(body.timestamp).toEqual(expect.any(String));
    expect(body.path).toBe('/attendance');
    expect(new Date(body.timestamp as string).toString()).not.toBe('Invalid Date');
  });
});
